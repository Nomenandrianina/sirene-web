import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus } from '@/notification/entities/notification.entity';
import { AlerteAudio } from '@/alerte-audio/entities/alerte-audio.entity';
import { Souscription, SouscriptionStatus } from '@/souscription/entities/souscription.entity';
import { PackType, Periode } from '@/packtype/entities/packtype.entity';
import { SouscriptionService } from '@/souscription/souscription.service';
import { SmsService }          from "@/sms/sms.service";
import { DiffusionPlanifiee } from 'src/diffusion-planifiee/entities/diffusion-planifiee.entity';
import { DiffusionPlanifieeService } from 'src/diffusion-planifiee/diffusion-planifiee.service';



function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
 
@Injectable()
export class DiffusionSchedulerService {
  private readonly logger = new Logger(DiffusionSchedulerService.name);
 
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
 
    @InjectRepository(AlerteAudio)
    private readonly audioRepo: Repository<AlerteAudio>,
 
    private readonly planifieeService: DiffusionPlanifieeService,
    private readonly souscriptionService: SouscriptionService,
    private readonly smsService: SmsService,
  ) {}
 
  // ── CRON 3h du matin ─────────────────────────────────────────────────────
  // Envoie la veille pour J+1 (le cerveau déclenche à l'heure schedulée)
 
  @Cron('0 3 * * *', { name: 'diffusion-3h', timeZone: 'Indian/Antananarivo' })
  async handleCron3h(): Promise<void> {
    const demain = toDateStr(addDays(new Date(), 1));
    this.logger.log(`[Cron 3h] Envoi des diffusions du ${demain}`);
    await this.processDiffusionsForDate(demain);
  }
 
  /** Expiration souscriptions chaque nuit à minuit */
  @Cron('0 0 * * *', { name: 'expire-souscriptions', timeZone: 'Indian/Antananarivo' })
  async handleExpiration(): Promise<void> {
    const count = await this.souscriptionService.expireOutdated();
    if (count > 0) this.logger.log(`[Expiration] ${count} souscription(s) expirée(s)`);
  }
 
  // ── LOGIQUE PRINCIPALE ────────────────────────────────────────────────────
 
  /**
   * Pour une date donnée :
   * 1. Récupère toutes les DiffusionPlanifiee PLANNED de ce jour
   * 2. Groupe par sirène → calcule l'offset dans le créneau
   * 3. Pour chaque ligne : charge les audios de la sirène,
   *    construit le message, crée une Notification et envoie le SMS
   */
  async processDiffusionsForDate(dateStr: string): Promise<ProcessResult> {
    const planifiees = await this.planifieeService.findPlannedForDate(dateStr);
 
    if (!planifiees.length) {
      this.logger.log(`[${dateStr}] Aucune diffusion planifiée`);
      return { date: dateStr, total: 0, sent: 0, skipped: 0, failed: 0 };
    }
 
    this.logger.log(`[${dateStr}] ${planifiees.length} diffusion(s) à traiter`);
 
    // Grouper par (sireneId + heure) pour calculer les offsets
    const groups = new Map<string, DiffusionPlanifiee[]>();
    for (const dp of planifiees) {
      const key = `${dp.sireneId}-${dp.scheduledHeure}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(dp);
    }
 
    let sent = 0, skipped = 0, failed = 0;
 
    for (const [key, items] of groups.entries()) {
      const [sireneIdStr, heureStr] = key.split('-');
      const sireneId = Number(sireneIdStr);
      const heure    = Number(heureStr);
 
      const result = await this.processGroup(dateStr, sireneId, heure, items,items[0].customerId);
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
  private async processGroup(dateStr:   string,sireneId:  number,heure: number,items: DiffusionPlanifiee[],customerId: number,  ): Promise<{ sent: number; skipped: number; failed: number }> {
    
    console.log("customerid :",customerId);
    // Charger les audios de la sirène (créés par le client)
    const audios = await this.audioRepo.find({
      where: [
        { sireneId, customerId },        // audios du client
      ],
      relations: ['sirene'],
      order:     { createdAt: 'ASC' },
    });
 

    console.log("audios :",audios);

    if (!audios.length) {
      this.logger.warn(`[Sirène #${sireneId}] Aucun audio — ${items.length} diffusion(s) ignorée(s)`);
      for (const dp of items) {
        await this.planifieeService.markSkipped(dp.id, 'Aucun audio disponible pour cette sirène');
      }
      return { sent: 0, skipped: items.length, failed: 0 };
    }
 
    // Heure de base du créneau pour ce jour
    const heureBase = new Date(`${dateStr}T${String(heure).padStart(2,'0')}:00:00`);
 
    let sent = 0, skipped = 0, failed = 0;
 
    // Pour chaque DiffusionPlanifiee du groupe, on envoie les audios en séquence
    for (const dp of items) {
      let offsetSecondes = 0;
 
      for (const audio of audios) {
        const scheduledAt = new Date(heureBase);
        scheduledAt.setSeconds(scheduledAt.getSeconds() + offsetSecondes);
 
        const message = this.buildMessage(
          audio.mobileId ?? `AUDIO_${audio.id}`,
          1, undefined, 'P2',
          scheduledAt,
        );
 
        // Créer la Notification
        const notif = this.notifRepo.create({
          message,
          sireneId,
          alerteAudioId:        audio.id,
          sousCategorieAlerteId: null,
          souscriptionId:        dp.souscriptionId,
          customerId:            dp.customerId,
          phoneNumber:           audio.sirene?.phoneNumberBrain ?? null,
          operator:              'Orange',
          type:                  'diffusion_commerciale',
          status:                NotificationStatus.PENDING,
          sendingTime:           new Date(),
          sendingTimeAfterAlerte: scheduledAt,
        });
 
        const saved = await this.notifRepo.save(notif);
 
        // Envoyer le SMS
        const ok = await this.dispatchSms(saved);
 
        if (ok) {
          await this.planifieeService.markSent(dp.id, saved.id);
          sent++;
        } else {
          failed++;
        }
 
        offsetSecondes += (audio.duration ?? 120);
      }
    }
 
    return { sent, skipped, failed };
  }
 
  // ── HELPERS ───────────────────────────────────────────────────────────────
 
  private buildMessage(
    mobileId: string, repeatCount = 1, repeatInterval?: number,
    priority: 'P1' | 'P2' = 'P2', scheduledDate?: Date,
  ): string {
    const datePart = scheduledDate
      ? ' ' + scheduledDate.toISOString().slice(0, 16)
      : ' ' + new Date().toISOString().slice(0, 16);
    return repeatCount <= 1
      ? `${mobileId} ${repeatCount} 0 ${priority}${datePart}`
      : `${mobileId} ${repeatCount} ${repeatInterval ?? '0'} ${priority}${datePart}`;
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
 