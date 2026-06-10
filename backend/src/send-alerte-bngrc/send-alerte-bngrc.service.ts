import { Injectable, Logger, NotFoundException, BadRequestException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In }   from 'typeorm';
import { Sirene } from '@/sirene/entities/sirene.entity';
import { Village } from '@/villages/entities/village.entity';
import { SmsService }       from '@/sms/sms.service';
import { SendAlerteBngrcDto } from './dto/send-alerte-bngrc.dto';
import { AudioAlerteBngrc, AudioBngrcStatus } from '@/audio-alerte-bngrc/entities/audio-alerte-bngrc.entity';
import { CategorieAlerteBngrc } from '@/categorie-alerte-bngrc/entities/categorie-alerte-bngrc.entity';
import { NotificationBngrc, NotificationBngrcStatus } from '@/notification-bngrc/entities/notification-bngrc.entity';
import { User } from '@/users/entities/user.entity';
import { ROLES } from 'src/common/constants/roles.constants';
import { Notificationsweb }   from '@/notificationsweb/entities/notificationsweb.entity';

// ── Heure Madagascar (UTC+3) ──────────────────────────────────────────────────
function toMadagascarISOString(date: Date): string {
  const offset = 3 * 60;
  const local  = new Date(date.getTime() + offset * 60 * 1000);
  return local.toISOString().slice(0, 16); // "2026-04-21T15:05"
}

@Injectable()
export class SendAlerteBngrcService {
  private readonly logger = new Logger(SendAlerteBngrcService.name);

  constructor(
    @InjectRepository(Sirene)
    private readonly sireneRepo: Repository<Sirene>,

    @InjectRepository(Village)
    private readonly villageRepo: Repository<Village>,

    @InjectRepository(AudioAlerteBngrc)
    private readonly audioBngrcRepo: Repository<AudioAlerteBngrc>,

    @InjectRepository(CategorieAlerteBngrc)
    private readonly categorieRepo: Repository<CategorieAlerteBngrc>,

    @InjectRepository(NotificationBngrc)
    private readonly notifRepo: Repository<NotificationBngrc>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  
    @InjectRepository(Notificationsweb)
    private readonly notifWebRepo: Repository<Notificationsweb>,

    private readonly smsService: SmsService,
  ) {}

  // ── Construction du message — même format que l'existant ─────────────────
  // "<mobileId> <repeatCount> <repeatInterval> <priority> <dateMadagascar>"
  private buildMessage(
    mobileId:      string,
    repeatCount  = 1,
    repeatInterval?: string,
    priority:    'P1' | 'P2' = 'P1', // BNGRC = urgence → P1 par défaut
    scheduledDate?: Date,
  ): string {
    const datePart = ' ' + toMadagascarISOString(scheduledDate ?? new Date());
    return repeatCount <= 1
      ? `${mobileId} ${repeatCount} 0 ${priority}${datePart}`
      : `${mobileId} ${repeatCount} ${repeatInterval ?? '0'} ${priority}${datePart}`;
  }

  // ── Envoi principal ───────────────────────────────────────────────────────
  async sendAlerteBngrc( dto: SendAlerteBngrcDto,  ): Promise<{ created: number; sent: number; planned: number }> {
    const {
      categorieAlerteBngrcId,
      provinceIds, regionIds, districtIds, villageIds,
      sendingTimeAfterAlerte,
      repeatCount  = 1,
      repeatInterval,
      alertPriority,
      userId,
    } = dto;

    // 1. Vérifier que la catégorie BNGRC existe
    const categorie = await this.categorieRepo.findOne({
      where: { id: categorieAlerteBngrcId }, relations: ['type'], 
    });
    if (!categorie) {
      throw new NotFoundException(
        `CategorieAlerteBngrc #${categorieAlerteBngrcId} introuvable`,
      );
    }

    // 2. Récupérer les audios APPROVED liés à cette catégorie (avec leurs sirènes)
    const audios = await this.audioBngrcRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.sirenes', 's')
      .where('a.categorieAlerteBngrcId = :categorieAlerteBngrcId', { categorieAlerteBngrcId })
      .andWhere('a.status = :status', { status: AudioBngrcStatus.APPROVED })
      .andWhere('a.deletedAt IS NULL')
      .getMany();

    // Map sireneId → audio BNGRC
    const audiosBySireneId = new Map<number, AudioAlerteBngrc>();
    for (const audio of audios) {
      for (const sirene of audio.sirenes ?? []) {
        audiosBySireneId.set(sirene.id, audio);
      }
    }

    // 3. Priorité — BNGRC = toujours P1 par défaut, superadmin peut choisir
    let finalPriority: 'P1' | 'P2' = 'P1';

    if (userId) {
      const user = await this.userRepo.findOne({
        where:     { id: userId },
        relations: ['customer', 'role'],
      });
      const isSuperAdmin = user?.role?.name?.toUpperCase() === ROLES.SUPERADMIN;
      if (isSuperAdmin && (alertPriority === 'P1' || alertPriority === 'P2')) {
        finalPriority = alertPriority;
      }
    }

    // 4. Résoudre les villages selon les zones — même logique que l'existant
    const hasVillageFilter  = !!(villageIds?.length);
    const hasDistrictFilter = !!(districtIds?.length);
    const hasRegionFilter   = !!(regionIds?.length);
    const hasProvinceFilter = !!(provinceIds?.length);
    const hasZoneFilter     =
      hasVillageFilter || hasDistrictFilter || hasRegionFilter || hasProvinceFilter;

    let resolvedVillageIds: number[] = [];

    if (hasZoneFilter) {
      if (hasVillageFilter) {
        resolvedVillageIds = villageIds!;
      } else {
        const villageQb = this.villageRepo
          .createQueryBuilder('v')
          .leftJoin('v.district', 'd')
          .leftJoin('d.region', 'r')
          .leftJoin('r.province', 'p')
          .select('v.id');

        const conditions: string[] = [];
        if (hasProvinceFilter) conditions.push('p.id IN (:...provinceIds)');
        if (hasRegionFilter)   conditions.push('r.id IN (:...regionIds)');
        if (hasDistrictFilter) conditions.push('d.id IN (:...districtIds)');
        villageQb.where(conditions.join(' OR '), { provinceIds, regionIds, districtIds });

        const villages = await villageQb.getMany();
        resolvedVillageIds = villages.map(v => v.id);
      }
    }

    // 5. Trouver les sirènes actives dans ces zones
    const sireneQb = this.sireneRepo
      .createQueryBuilder('s')
      .where('s.isActive = true');

    if (hasZoneFilter && resolvedVillageIds.length) {
      sireneQb.andWhere('s.villageId IN (:...resolvedVillageIds)', { resolvedVillageIds });
    } else if (hasZoneFilter && !resolvedVillageIds.length) {
      return { created: 0, sent: 0, planned: 0 };
    }

    const sirenes = await sireneQb.getMany();
    if (!sirenes.length) {
      throw new BadRequestException(
        'Aucune sirène active trouvée dans les zones sélectionnées',
      );
    }

    const scheduledDate = sendingTimeAfterAlerte
      ? new Date(sendingTimeAfterAlerte)
      : new Date();

    let sent = 0;

    // 6. Créer une notification par sirène — même pattern que sendAlerte
    for (const sirene of sirenes) {
      const audio = audiosBySireneId.get(sirene.id);

      if (!audio) {
        this.logger.warn(
          `[BNGRC] Sirène #${sirene.id} ignorée — aucun audio BNGRC approuvé pour catégorie #${categorieAlerteBngrcId}`,
        );
        continue;
      }

      const mobileId = audio.mobileId ?? `BNGRC_CAT_${categorieAlerteBngrcId}`;
      const message  = this.buildMessage(
        mobileId, repeatCount, repeatInterval, finalPriority, scheduledDate,
      );

      this.logger.log(`[BNGRC Sirène #${sirene.id}] message: ${message}`);

      const notif = new NotificationBngrc();
      notif.message                = message;
      notif.sireneId               = sirene.id;
      notif.audioBngrcId           = audio.id;           // ← AudioAlerteBngrc, pas AlerteAudio
      notif.categorieAlerteBngrcId = categorieAlerteBngrcId; // ← catégorie BNGRC, pas sousCatégorie
      notif.phoneNumber            = sirene.phoneNumberBrain;
      notif.operator               = sirene.communicationType === 'DATA' ? 'FCM' : 'Orange';
      notif.type                   = `BNGRC — ${categorie.name}`;
      notif.userId                 = userId ?? null;
      notif.status                 = NotificationBngrcStatus.PENDING;
      notif.sendingTimeAfterAlerte = sendingTimeAfterAlerte
        ? new Date(sendingTimeAfterAlerte)
        : null;
      notif.sendingTime            = new Date();

      const saved = await this.notifRepo.save(notif);
      await this.dispatchNotification(saved, sirene);
      sent++;

      if (sent > 0) {
        let senderName   = 'Admin';
        let customerName = '';
     
        if (userId) {
          // Charger l'user avec son rôle ET son client (relation customer)
          const sender = await this.userRepo.findOne({
            where:     { id: userId },
            relations: ['role', 'customer'],
          });
     
          if (sender) {
            // Nom affiché : "Prénom Nom" ou email en fallback
            senderName = [sender.first_name, sender.last_name].filter(Boolean).join(' ').trim() || sender.email || 'Utilisateur';
            customerName = sender.customer?.name ?? '';
          }
        }
     
        await this.createBngrcNotifWeb({
          typeAlerteName: categorie.type?.name ?? '', 
          categorieName: categorie.name,
          sentCount:     sent,
          totalCount:    sirenes.length,
          senderName,
          customerName,
          scheduledDate,
        });
      }
    }

    return { created: sirenes.length, sent, planned: 0 };
  }

  // ── dispatchNotification — copie exacte de l'existant ────────────────────
  async dispatchNotification(notif: NotificationBngrc, sirene: Sirene): Promise<void> {
    try {
      if (sirene.communicationType === 'DATA') {
        if (!sirene.fcmToken) {
          this.logger.warn(`[BNGRC] Notification #${notif.id} ignorée — token FCM manquant`);
          await this.notifRepo.update(notif.id, {
            status:      NotificationBngrcStatus.FAILED,
            observation: 'Token FCM manquant',
          });
          return;
        }

        const messageId = await this.smsService.sendViaData(sirene, notif.message);
        await this.notifRepo.update(notif.id, {
          status:         NotificationBngrcStatus.SENT,
          messageId,
          sendingTime:    new Date(),
          operatorStatus: 'sent_via_data',
        });

      } else {
        if (!notif.phoneNumber) {
          this.logger.warn(`[BNGRC] Notification #${notif.id} ignorée — numéro manquant`);
          await this.notifRepo.update(notif.id, {
            status:      NotificationBngrcStatus.FAILED,
            observation: 'Numéro de téléphone manquant',
          });
          return;
        }

        const response    = await this.smsService.sendSms(notif.phoneNumber, notif.message);
        const resourceURL = response?.outboundSMSMessageRequest?.resourceURL ?? '';
        const messageId   = resourceURL ? resourceURL.split('/').pop() : undefined;

        await this.notifRepo.update(notif.id, {
          status:         NotificationBngrcStatus.SENT,
          messageId:      messageId ?? undefined,
          sendingTime:    new Date(),
          operatorStatus: 'sent',
        });
      }
    } catch (err: any) {
      this.logger.error(
        `[BNGRC] Dispatch failed notification #${notif.id} → sirène #${sirene.id}: ${err.message}`,
      );
      await this.notifRepo.update(notif.id, {
        status:      NotificationBngrcStatus.FAILED,
        observation: (err.message as string)?.slice(0, 255),
      });
    }
  }

  // ── Preview zones — identique à SendAlerteService.preview ────────────────
  async preview( dto: Partial<SendAlerteBngrcDto>, ): Promise<{ sireneCount: number; sirenes: any[] }> {
    const { provinceIds, regionIds, districtIds, villageIds } = dto;

    const hasVillageFilter  = !!(villageIds?.length);
    const hasDistrictFilter = !!(districtIds?.length);
    const hasRegionFilter   = !!(regionIds?.length);
    const hasProvinceFilter = !!(provinceIds?.length);
    const hasZoneFilter     =
      hasVillageFilter || hasDistrictFilter || hasRegionFilter || hasProvinceFilter;

    let resolvedVillageIds: number[] = [];

    if (hasZoneFilter) {
      if (hasVillageFilter) {
        resolvedVillageIds = villageIds!;
      } else {
        const villageQb = this.villageRepo
          .createQueryBuilder('v')
          .leftJoin('v.district', 'd')
          .leftJoin('d.region', 'r')
          .leftJoin('r.province', 'p')
          .select('v.id');

        const conditions: string[] = [];
        if (hasProvinceFilter) conditions.push('p.id IN (:...provinceIds)');
        if (hasRegionFilter)   conditions.push('r.id IN (:...regionIds)');
        if (hasDistrictFilter) conditions.push('d.id IN (:...districtIds)');
        villageQb.where(conditions.join(' OR '), { provinceIds, regionIds, districtIds });

        const villages = await villageQb.getMany();
        resolvedVillageIds = villages.map(v => v.id);
      }
    }

    const sireneQb = this.sireneRepo
      .createQueryBuilder('s')
      .leftJoin('s.village', 'v')
      .addSelect(['s.id', 's.imei', 's.phoneNumberBrain', 'v.name'])
      .where('s.isActive = true');

    if (hasZoneFilter && resolvedVillageIds.length) {
      sireneQb.andWhere('s.villageId IN (:...resolvedVillageIds)', { resolvedVillageIds });
    } else if (hasZoneFilter && !resolvedVillageIds.length) {
      return { sireneCount: 0, sirenes: [] };
    }

    const sirenes = await sireneQb.getMany();
    return { sireneCount: sirenes.length, sirenes };
  }

  private async createBngrcNotifWeb(params: {
    typeAlerteName: string; 
    categorieName:  string;
    sentCount:      number;
    totalCount:     number;
    senderName:     string;
    customerName:   string;
    scheduledDate:  Date;
  }): Promise<void> {
    const {
      typeAlerteName, categorieName,
      sentCount, totalCount,
      senderName, customerName,
      scheduledDate,
    } = params;
   
    const targets = await this.userRepo
      .createQueryBuilder('u')
      .leftJoin('u.role', 'r')
      .where('r.name IN (:...roles)', {
        roles: [ROLES.SUPERADMIN, ROLES.BNGRC_ALERTE, ROLES.BNGRC_CONTROL],
      })
      .andWhere('u.deletedAt IS NULL')
      .getMany();
   
    if (!targets.length) return;
   
    // ── Format date/heure ──────────────────────────────────────────────────────
    const dateLabel = scheduledDate.toLocaleDateString('fr-FR', {
      day:   '2-digit',
      month: '2-digit',
      year:  'numeric',
    }); // ex: "14/06/2026"
   
    const timeLabel = scheduledDate.toLocaleTimeString('fr-FR', {
      hour:   '2-digit',
      minute: '2-digit',
    }); // ex: "14:33"
   
    // ── Ligne principale : TypeAlerteBngrc — CategorieAlerteBngrc — X/Y sirènes — date heure
    // Ex: "Cyclone — Alerte rouge — 3/5 sirènes — 14/06/2026 à 14:33"
    const alerteLabel = typeAlerteName
      ? `${typeAlerteName} — ${categorieName}`
      : categorieName;
   
    const mainText = `${alerteLabel} — ${sentCount}/${totalCount} sirène${sentCount > 1 ? 's' : ''} — ${dateLabel} à ${timeLabel}`;
   
    // Format "texte||expéditeur||client" (compatible parseMessage frontend)
    const message = [mainText, senderName, customerName].join('||');
   
    const notifs = targets.map(user => {
      const n      = new Notificationsweb();
      n.type       = 'BNGRC_ALERTE';
      n.message    = message;
      n.entityType = 'notification_sirene_alerte_bngrc';
      n.url        = '/sirene-map-alert';
      n.isRead     = false;
      n.userId     = user.id;
      return n;
    });
   
    await this.notifWebRepo.save(notifs);
  }
  
}
