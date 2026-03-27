import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Sirene } from "@/sirene/entities/sirene.entity";
import { Village }             from "@/villages/entities/village.entity";
import { SousCategorieAlerte } from "@/sous-categorie-alerte/entities/sous-categorie-alerte.entity";
import { AlerteAudio } from "@/alerte-audio/entities/alerte-audio.entity";
import { Notification, NotificationStatus } from "@/notification/entities/notification.entity";
import { SmsService }          from "@/services/sms.service";
import { SendAlerteDto }       from "./dto/send-alerte.dto";
import { User } from "@/users/entities/user.entity";

@Injectable()
export class SendAlerteService {
  private readonly logger = new Logger(SendAlerteService.name);
 
  constructor(
    @InjectRepository(Sirene)              private readonly sireneRepo: Repository<Sirene>,
    @InjectRepository(Village)             private readonly villageRepo: Repository<Village>,
    @InjectRepository(SousCategorieAlerte) private readonly sousCatRepo: Repository<SousCategorieAlerte>,
    @InjectRepository(AlerteAudio)         private readonly audioRepo: Repository<AlerteAudio>,
    @InjectRepository(Notification)        private readonly notifRepo: Repository<Notification>,
    @InjectRepository(User)        private readonly userRepo: Repository<User>,

    private readonly smsService: SmsService,
  ) {}
 
  // ── Construction du message ──────────────────────────────────────────────
  // Format : "<mobileId> <repeatCount>"
  //       ou "<mobileId> <repeatCount> <repeatInterval>" si repeatCount > 1
  private buildMessage(
    mobileId: string,
    repeatCount = 1,
    repeatInterval?: number,        // ← string maintenant ex: "5min", "2h", "1j", "0"
    priority: 'P1' | 'P2' = 'P2',  // ← nouveau
  ): string {
    if (repeatCount <= 1) {
      return `${mobileId} ${repeatCount} 0 ${priority}`;
    }
    return `${mobileId} ${repeatCount} ${repeatInterval ?? '0'} ${priority}`;
  }
 
  async sendAlerte(dto: SendAlerteDto): Promise<{ created: number; sent: number; planned: number }> {
    const {
      sousCategorieAlerteId,
      provinceIds, regionIds, districtIds,
      villageIds,
      sendingTimeAfterAlerte,
      repeatCount = 1,
      repeatInterval,
      alertPriority,   // ← nouveau champ dans le DTO (optionnel, envoyé par le frontend)
      userId,
    } = dto;

   
    // 1. Vérifier que la sous-catégorie existe
    const sousCat = await this.sousCatRepo.findOne({ where: { id: sousCategorieAlerteId } });
    if (!sousCat) throw new NotFoundException(`SousCategorieAlerte #${sousCategorieAlerteId} introuvable`);
   
    // 2. Récupérer l'audio lié à cette sous-catégorie
    const audio = await this.audioRepo.findOne({ where: { sousCategorieAlerteId } });
   
    // ── Récupérer la priorité du customer lié à l'user connecté ──────────────
    let finalPriority: 'P1' | 'P2' = 'P2'; // par défaut : normale
   
    if (userId) {
      const user = await this.userRepo.findOne({
        where: { id: userId },
        relations: ['customer', 'role'],  
      });
   
      const customerPriority = user?.customer?.priority;
      const isSuperAdmin = user?.role?.name?.toLowerCase().includes('superadmin');
      console.log('isusper',isSuperAdmin)

   
      if (isSuperAdmin || customerPriority === 'urgent') {
        // Le client est urgent — il peut choisir P1 ou P2 selon l'alerte
        // alertPriority est envoyé par le frontend si le client a choisi
        finalPriority = (alertPriority === 'P1' || alertPriority === 'P2')
          ? alertPriority
          : 'P1'; // par défaut P1 pour les urgents si pas de choix
      } else {
        // Client normal → toujours P2, pas de choix possible
        finalPriority = 'P2';
      }
    }
    // ─────────────────────────────────────────────────────────────────────────
   
    // 3. Trouver les villages selon les zones sélectionnées
    const hasVillageFilter  = !!(villageIds?.length);
    const hasDistrictFilter = !!(districtIds?.length);
    const hasRegionFilter   = !!(regionIds?.length);
    const hasProvinceFilter = !!(provinceIds?.length);
    const hasZoneFilter     = hasVillageFilter || hasDistrictFilter || hasRegionFilter || hasProvinceFilter;
   
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
   
    // 4. Trouver les sirènes actives dans ces villages
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
      throw new BadRequestException('Aucune sirène active trouvée dans les zones sélectionnées');
    }
   
    // 5. Construction du message avec répétition + priorité
    const mobileId = audio?.mobileId ?? `ALERTE_${sousCategorieAlerteId}`;
    const message  = this.buildMessage(mobileId, repeatCount, repeatInterval, finalPriority);
   
    // Exemples de messages générés :
    // Client normal,  1 répétition  → "ALERTE_767 1 0 P2"
    // Client normal,  3 répétitions → "ALERTE_767 3 5min P2"
    // Client urgent,  choisit P1    → "ALERTE_767 3 5min P1"
    // Client urgent,  choisit P2    → "ALERTE_767 3 5min P2"
   
    const isNow    = !sendingTimeAfterAlerte;
    const planDate = sendingTimeAfterAlerte ? new Date(sendingTimeAfterAlerte) : null;
   
    let sent = 0, planned = 0;
   
    // 6. Créer une notification par sirène
    for (const sirene of sirenes) {
      const notif = new Notification();
      notif.message                = message;
      notif.sireneId               = sirene.id;
      notif.sousCategorieAlerteId  = sousCategorieAlerteId;
      notif.alerteAudioId          = audio?.id ?? null;
      notif.phoneNumber            = sirene.phoneNumberBrain;
      notif.operator               = 'Orange';
      notif.type                   = sousCat.name;
      notif.userId                 = userId ?? null;
      notif.status                 = NotificationStatus.PENDING;
      notif.sendingTimeAfterAlerte = planDate ?? null;
      notif.sendingTime            = isNow ? new Date() : null;
   
      const saved: Notification = await this.notifRepo.save(notif);
   
      if (isNow) {
        await this.dispatchSms(saved);
        sent++;
      } else {
        planned++;
      }
    }
   
    return { created: sirenes.length, sent, planned };
  }
 
  async dispatchSms(notif: Notification): Promise<void> {
    if (!notif.phoneNumber) {
      this.logger.warn(`Notification #${notif.id} ignorée — numéro de téléphone manquant`);
      await this.notifRepo.update(notif.id, {
        status:      NotificationStatus.FAILED,
        observation: "Numéro de téléphone manquant",
      });
      return;
    }
    try {
      const response = await this.smsService.sendSms(notif.phoneNumber, notif.message);
 
      const resourceURL: string     = response?.outboundSMSMessageRequest?.resourceURL ?? "";
      const messageId: string | undefined = resourceURL ? resourceURL.split("/").pop() : undefined;
 
      await this.notifRepo.update(notif.id, {
        status:         NotificationStatus.SENT,
        messageId:      messageId ?? undefined,
        sendingTime:    new Date(),
        operatorStatus: "sent",
      });
    } catch (err: any) {
      this.logger.error(`SMS failed for notification #${notif.id} → ${notif.phoneNumber}: ${err.message}`);
      await this.notifRepo.update(notif.id, {
        status:      NotificationStatus.FAILED,
        observation: (err.message as string)?.slice(0, 255),
      });
    }
  }
 
  @Cron(CronExpression.EVERY_MINUTE)
  async processPlannedNotifications(): Promise<void> {
    const now = new Date();
 
    const pending: Notification[] = await this.notifRepo
      .createQueryBuilder("n")
      .where("n.status = :status",                      { status: NotificationStatus.PENDING })
      .andWhere("n.sendingTimeAfterAlerte IS NOT NULL")
      .andWhere("n.sendingTimeAfterAlerte <= :now",     { now })
      .andWhere("n.sendingTime IS NULL")
      .getMany();
 
    if (!pending.length) return;
 
    this.logger.log(`Cron: ${pending.length} notification(s) planifiée(s) à envoyer`);
 
    for (const notif of pending) {
      await this.dispatchSms(notif);
    }
  }
 
  // ── Preview — inclut maintenant le filtre par villages ───────────────────
  async preview(dto: Partial<SendAlerteDto>): Promise<{ sireneCount: number; sirenes: any[] }> {
    const { provinceIds, regionIds, districtIds, villageIds } = dto;
 
    const hasVillageFilter  = !!(villageIds?.length);
    const hasDistrictFilter = !!(districtIds?.length);
    const hasRegionFilter   = !!(regionIds?.length);
    const hasProvinceFilter = !!(provinceIds?.length);
    const hasZoneFilter     = hasVillageFilter || hasDistrictFilter || hasRegionFilter || hasProvinceFilter;
 
    let resolvedVillageIds: number[] = [];
 
    if (hasZoneFilter) {
      if (hasVillageFilter) {
        resolvedVillageIds = villageIds!;
      } else {
        const villageQb = this.villageRepo
          .createQueryBuilder("v")
          .leftJoin("v.district", "d")
          .leftJoin("d.region", "r")
          .leftJoin("r.province", "p")
          .select("v.id");
 
        const conditions: string[] = [];
        if (hasProvinceFilter) conditions.push("p.id IN (:...provinceIds)");
        if (hasRegionFilter)   conditions.push("r.id IN (:...regionIds)");
        if (hasDistrictFilter) conditions.push("d.id IN (:...districtIds)");
        villageQb.where(conditions.join(" OR "), { provinceIds, regionIds, districtIds });
 
        const villages = await villageQb.getMany();
        resolvedVillageIds = villages.map(v => v.id);
      }
    }
 
    const sireneQb = this.sireneRepo
      .createQueryBuilder("s")
      .leftJoin("s.village", "v")
      .addSelect(["s.id", "s.imei", "s.phoneNumberBrain", "v.name"])
      .where("s.isActive = true");
 
    if (hasZoneFilter && resolvedVillageIds.length) {
      sireneQb.andWhere("s.villageId IN (:...resolvedVillageIds)", { resolvedVillageIds });
    } else if (hasZoneFilter && !resolvedVillageIds.length) {
      return { sireneCount: 0, sirenes: [] };
    }
 
    const sirenes = await sireneQb.getMany();
    return { sireneCount: sirenes.length, sirenes };
  }
}
 