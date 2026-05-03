import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus } from '@/notification/entities/notification.entity';
import { AlerteAudio, AudioValidationStatus } from '@/alerte-audio/entities/alerte-audio.entity';
import { Souscription, SouscriptionStatus } from '@/souscription/entities/souscription.entity';
import { PackType, Periode } from '@/packtype/entities/packtype.entity';
import { SouscriptionService } from '@/souscription/souscription.service';
import { SmsService }          from "@/sms/sms.service";
import { DiffusionPlanifiee } from 'src/diffusion-planifiee/entities/diffusion-planifiee.entity';
import { DiffusionPlanifieeService } from 'src/diffusion-planifiee/diffusion-planifiee.service';
import { Sirene } from '@/sirene/entities/sirene.entity';
import { DiffusionConfig } from 'src/diffusion-config/entities/diffusion-config.entity';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { DiffusionConfigService } from 'src/diffusion-config/diffusion-config.service';

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

function toMadagascarISOString(date: Date): string {
  // UTC+3 — Indian/Antananarivo
  const offset = 3 * 60; // minutes
  const local  = new Date(date.getTime() + offset * 60 * 1000);
  return local.toISOString().slice(0, 16); // "2026-04-21T15:05"
}
 
@Injectable()
export class DiffusionSchedulerService {
  private readonly logger = new Logger(DiffusionSchedulerService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @InjectRepository(AlerteAudio)
    private readonly audioRepo: Repository<AlerteAudio>,
    @InjectRepository(Sirene)
    private readonly sireneRepo: Repository<Sirene>,
    @InjectRepository(DiffusionConfig)
    private readonly configRepo: Repository<DiffusionConfig>,
    private readonly schedulerRegistry:   SchedulerRegistry,
    private readonly planifieeService:    DiffusionPlanifieeService,
    private readonly souscriptionService: SouscriptionService,
    private readonly smsService:          SmsService,
    private readonly configService:          DiffusionConfigService,
  ) {}

  // ── Démarrage ─────────────────────────────────────────────────────────────

  async onModuleInit(): Promise<void> {
    // enregistre le callback pour que ConfigService puisse déclencher un reload
    this.configService.setReloadCallback(() => this.reloadAllCrons());
    await this.reloadAllCrons();
  }
  


  /**
   * (Re)crée tous les crons dynamiques depuis la base.
   * Appelé au démarrage et après chaque update de config.
   */
  async reloadAllCrons(): Promise<void> {
    // 1. Supprimer tous les anciens jobs dynamiques
    const existing = this.schedulerRegistry.getCronJobs();
    for (const [name] of existing) {
      if (name.startsWith('diffusion-')) {
        this.schedulerRegistry.deleteCronJob(name);
      }
    }

    // 2. Charger toutes les configs actives
    const configs = await this.configRepo.find({ where: { isActive: true } });

    if (!configs.length) {
      this.logger.warn('[Cron] Aucune DiffusionConfig active — fallback 3h global');
      this.registerCronJob('diffusion-global', '0 3 * * *', null);
      return;
    }

    for (const config of configs) {
      const jobName = config.regionId
        ? `diffusion-region-${config.regionId}`
        : 'diffusion-global';

      const dayPart  = config.sendDays?.length ? config.sendDays.join(',') : '*';
      const cronExpr = `${config.sendMinute} ${config.sendHour} * * ${dayPart}`;

      this.registerCronJob(jobName, cronExpr, config.regionId ?? null);
    }
  }

  private registerCronJob(
    name:     string,
    cronExpr: string,
    regionId: number | null,
  ): void {
    const job = new CronJob(
      cronExpr,
      async () => {
        const demain = toDateStr(new Date());
        this.logger.log(`[${name}] Déclenchement — diffusions du ${demain}`);
        await this.processDiffusionsForDate(demain, regionId);
      },
      null,
      true,
      'Indian/Antananarivo',
    );
    this.schedulerRegistry.addCronJob(name, job);
    this.logger.log(`[Cron] "${name}" enregistré → expr: "${cronExpr}" regionId: ${regionId ?? 'global'}`);
  }

  // ── Expiration souscriptions (inchangé) ───────────────────────────────────

  /** Enregistré séparément car fixe */
  async registerExpirationCron(): Promise<void> {
    const job = new CronJob(
      '0 0 * * *',
      async () => {
        const count = await this.souscriptionService.expireOutdated();
        if (count > 0) this.logger.log(`[Expiration] ${count} souscription(s) expirée(s)`);
      },
      null, true, 'Indian/Antananarivo',
    );
    this.schedulerRegistry.addCronJob('expire-souscriptions', job);
  }

  // ── Logique principale ────────────────────────────────────────────────────

  /**
   * @param regionId null = traite TOUTES les sirènes (config globale)
   *                 number = traite uniquement les sirènes de cette région
   */
  async processDiffusionsForDate(dateStr:  string,regionId: number | null, ): Promise<ProcessResult> {

    // findPlannedForDate filtre déjà par date ;
    // on passe regionId pour qu'il filtre aussi par région si besoin
    const planifiees = await this.planifieeService.findPlannedForDate(dateStr, regionId);

    console.log('[debug] planifiees reçus dans processDiffusionsForDate:', planifiees.length);
    console.log('[debug] premier item:', JSON.stringify(planifiees[0]));

    if (!planifiees.length) {
      this.logger.log(`[${dateStr}][region:${regionId ?? 'global'}] Aucune diffusion planifiée`);
      return { date: dateStr, total: 0, sent: 0, skipped: 0, failed: 0 };
    }

    this.logger.log(`[${dateStr}] ${planifiees.length} diffusion(s) à traiter`);

    const groups = new Map<string, DiffusionPlanifiee[]>();

    for (const dp of planifiees) {
      const key = `${dp.sireneId}-${dp.scheduledHeure}-${dp.scheduledMinute ?? 0}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(dp);
    }

    let sent = 0, skipped = 0, failed = 0;
    for (const [key, items] of groups.entries()) {
    const [sireneIdStr, heureStr, minuteStr] = key.split('-');
    console.log('[debug] processGroup', { key, sireneId: Number(sireneIdStr), heure: Number(heureStr), items: items.length });
    const result = await this.processGroup(dateStr, Number(sireneIdStr), Number(heureStr), Number(minuteStr), items);
    console.log('[debug] processGroup result', result);
    sent    += result.sent;
    skipped += result.skipped;
    failed  += result.failed;
  }

    this.logger.log(`[${dateStr}] Terminé — envoyés:${sent} ignorés:${skipped} échecs:${failed}`);
    return { date: dateStr, total: planifiees.length, sent, skipped, failed };
  }
 
  /**
   * Traite un groupe (même sirène, même créneau) :
   * - Charge les audios liés à la sirène
   * - Calcule l'offset cumulé par audio dans le créneau
   * - Envoie un SMS par audio × par diffusion planifiée du groupe
   */
  private async processGroup(
    dateStr: string,
    sireneId: number,
    heure: number,
    minute: number, 
    items: DiffusionPlanifiee[],
  ): Promise<{ sent: number; skipped: number; failed: number }> {
  
    const heureBase = new Date(
      `${dateStr}T${String(heure).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00`
    );    let globalOffsetSecondes = 0;
    let sent = 0, skipped = 0, failed = 0;
  
    // ← charger la sirène une seule fois pour tout le groupe
    const sirene = await this.sireneRepo.findOne({ where: { id: sireneId } });
    if (!sirene) {
      this.logger.warn(`[Sirène #${sireneId}] Introuvable — groupe ignoré`);
      return { sent: 0, skipped: items.length, failed: 0 };
    }
  
    for (const dp of items) {
      const audios = await this.audioRepo
      .createQueryBuilder('aa')
      .leftJoinAndSelect('aa.sirenes', 's')
      .where('aa.customerId = :customerId', { customerId: dp.customerId })
      .andWhere('s.id = :sireneId', { sireneId })
      .andWhere('aa.status = :status', { status: AudioValidationStatus.APPROVED })
      .andWhere('aa.deletedAt IS NULL')
      .orderBy('aa.createdAt', 'ASC')
      .getMany();

  
      if (!audios.length) {
        this.logger.warn(
          `[Sirène #${sireneId}] Aucun audio pour customer #${dp.customerId} — diffusion #${dp.id} ignorée`,
        );
        await this.planifieeService.markSkipped(dp.id, 'Aucun audio disponible pour cette sirène');
        skipped++;
        continue;
      }
  
      for (const audio of audios) {
        const scheduledAt = new Date(heureBase);
        scheduledAt.setSeconds(scheduledAt.getSeconds() + globalOffsetSecondes);
  
        const message = this.buildMessage(
          audio.mobileId ?? `AUDIO_${audio.id}`,
          1, undefined, 'P2',
          scheduledAt,
        );
  
        const notif = this.notifRepo.create({
          message,
          sireneId,
          alerteAudioId:          audio.id,
          sousCategorieAlerteId:  null,
          souscriptionId:         dp.souscriptionId,
          customerId:             dp.customerId,
          phoneNumber:            sirene.phoneNumberBrain ?? null,
          operator:               sirene.communicationType === 'DATA' ? 'FCM' : 'Orange', // ←
          type:                   'diffusion_commerciale',
          status:                 NotificationStatus.PENDING,
          sendingTime:            new Date(),
          sendingTimeAfterAlerte: scheduledAt,
        });
  
        const saved = await this.notifRepo.save(notif);
        const ok    = await this.dispatchNotification(saved, sirene); // ← on passe sirene
  
        if (ok) {
          await this.planifieeService.markSent(dp.id, saved.id);
          sent++;
        } else {
          failed++;
        }
  
        globalOffsetSecondes += (audio.duration ?? 120);
      }
    }
  
    return { sent, skipped, failed };
  }
 
  // ── HELPERS ───────────────────────────────────────────────────────────────
 
  private buildMessage(mobileId: string,
    repeatCount = 1,
    repeatInterval?: number,
    priority: 'P1' | 'P2' = 'P2',
    scheduledDate?: Date,
  ): string {
    const datePart = scheduledDate
      ? ' ' + toMadagascarISOString(scheduledDate)
      : ' ' + toMadagascarISOString(new Date());
  
    return repeatCount <= 1
      ? `${mobileId} ${repeatCount} 0 ${priority}${datePart}`
      : `${mobileId} ${repeatCount} ${repeatInterval ?? '0'} ${priority}${datePart}`;
  }


  private async dispatchNotification(notif: Notification, sirene: Sirene): Promise<boolean> {
    try {
      if (sirene.communicationType === 'DATA') {
        // ── Envoi FCM ───────────────────────────────────────────────
        if (!sirene.fcmToken) {
          this.logger.warn(`[FCM] Notification #${notif.id} — token FCM manquant`);
          await this.notifRepo.update(notif.id, {
            status:      NotificationStatus.FAILED,
            observation: 'Token FCM manquant',
          });
          return false;
        }
  
        const messageId = await this.smsService.sendViaData(sirene, notif.message);
  
        await this.notifRepo.update(notif.id, {
          status:         NotificationStatus.SENT,
          messageId:      messageId ?? null,
          sendingTime:    new Date(),
          operatorStatus: 'sent_via_data',
        });
        return true;
  
      } else {
        // ── Envoi SMS ────────────────────────────────────────────────
        if (!notif.phoneNumber) {
          this.logger.warn(`[SMS] Notification #${notif.id} — numéro manquant`);
          await this.notifRepo.update(notif.id, {
            status:      NotificationStatus.FAILED,
            observation: 'Numéro manquant',
          });
          return false;
        }
  
        const response    = await this.smsService.sendSms(notif.phoneNumber, notif.message);
        const resourceURL = response?.outboundSMSMessageRequest?.resourceURL ?? '';
        const messageId   = resourceURL ? resourceURL.split('/').pop() : undefined;
  
        await this.notifRepo.update(notif.id, {
          status:         NotificationStatus.SENT,
          messageId:      messageId ?? null,
          sendingTime:    new Date(),
          operatorStatus: 'sent',
        });
        return true;
      }
  
    } catch (err: any) {
      this.logger.error(
        `[${sirene.communicationType}] Échec notification #${notif.id} sirène #${sirene.id} : ${err.message}`
      );
      await this.notifRepo.update(notif.id, {
        status:      NotificationStatus.FAILED,
        observation: err.message?.slice(0, 254),
      });
      return false;
    }
  }
 
  private async dispatchSms(notif: Notification): Promise<boolean> {
    if (!notif.phoneNumber) {
      await this.notifRepo.update(notif.id, {
        status: NotificationStatus.FAILED, observation: 'Numéro manquant',
      });
      return false;
    }
    try {
      const response = await this.smsService.sendSms(notif.phoneNumber, notif.message);
      const resourceURL = response?.outboundSMSMessageRequest?.resourceURL ?? '';
      const messageId   = resourceURL ? resourceURL.split('/').pop() : undefined;
      await this.notifRepo.update(notif.id, {
        status: NotificationStatus.SENT, messageId: messageId ?? null,
        sendingTime: new Date(), operatorStatus: 'sent',
      });
      return true;
    } catch (err: any) {
      this.logger.error(`[SMS] Échec #${notif.id} : ${err.message}`);
      await this.notifRepo.update(notif.id, {
        status: NotificationStatus.FAILED, observation: err.message?.slice(0, 254),
      });
      return false;
    }
  }

  
}
 
export interface ProcessResult {
  date: string; total: number; sent: number; skipped: number; failed: number;
}
 