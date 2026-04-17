import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, Not } from 'typeorm';
import { Notification, NotificationStatus } from '@/notification/entities/notification.entity';
import { PlanningDiffusion, PlanningStatus } from './entities/planning-diffusion.entity';
import { SmsService } from 'src/sms/sms.service';

export interface PlanningQueryDto {
  /** Début de la plage (lundi de la semaine) */
  from: string;   // ISO date: "2026-04-13"
  /** Fin de la plage (dimanche de la semaine) */
  to:   string;   // ISO date: "2026-04-20"
  /** Filtrer par souscription (optionnel) */
  souscriptionId?: number;
  /** Filtrer par customer — pour superadmin */
  customerId?: number;
  /** Filtrer par user — pour client */
  userId?: number;
}

export interface PlanningSlot {
  date:   string;   // "2026-04-14"
  heure:  number;   // 7 | 12 | 16
  notifications: PlanningNotification[];
}

export interface PlanningNotification {
  id:                  number;
  status:              string;
  message:             string;
  scheduledAt:         string;   // sendingTimeAfterAlerte
  sireneId:            number;
  sireneName:          string | null;
  audioId:             number | null;
  audioName:           string | null;
  souscriptionId:      number | null;
  canCancel:           boolean;  // PENDING et dans le futur
}

@Injectable()
export class PlanningDiffusionService {
  constructor(
    @InjectRepository(PlanningDiffusion)
    private readonly planningRepo: Repository<PlanningDiffusion>,
    
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,

    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,

    private readonly smsService: SmsService,
  ) {}

  /**
   * Retourne les diffusions commerciales organisées par date + créneau.
   * Utilisé par la vue planning hebdomadaire.
   */
  async getPlanning(query: PlanningQueryDto): Promise<PlanningSlot[]> {
    const from = new Date(query.from + 'T00:00:00');
    const to   = new Date(query.to   + 'T23:59:59');

    const qb = this.repo
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.sirene',      'sirene')
      .leftJoinAndSelect('n.alerteAudio', 'audio')
      .where('n.type = :type', { type: 'diffusion_commerciale' })
      .andWhere('n.sending_time_after_alerte BETWEEN :from AND :to', { from, to })
      .orderBy('n.sending_time_after_alerte', 'ASC');

    if (query.souscriptionId) {
      qb.andWhere('n.souscription_id = :sid', { sid: query.souscriptionId });
    }
    if (query.userId) {
      qb.andWhere('n.user_id = :uid', { uid: query.userId });
    }
    // Pour filtrer par customer, on passe par la souscription
    if (query.customerId) {
      qb.innerJoin('souscription', 's', 's.id = n.souscription_id AND s.customer_id = :cid',
        { cid: query.customerId });
    }

    const notifications = await qb.getMany();
    const now = new Date();

    // Organiser par date + créneau
    const slots = new Map<string, PlanningSlot>();

    for (const n of notifications) {
      const scheduledAt = n.sendingTimeAfterAlerte;
      if (!scheduledAt) continue;

      const dateStr = scheduledAt.toISOString().split('T')[0];
      const heure   = scheduledAt.getHours(); // 7, 12 ou 16

      const key = `${dateStr}-${heure}`;
      if (!slots.has(key)) {
        slots.set(key, { date: dateStr, heure, notifications: [] });
      }

      slots.get(key)!.notifications.push({
        id:             n.id,
        status:         n.status ?? 'unknown',
        message:        n.message,
        scheduledAt:    scheduledAt.toISOString(),
        sireneId:       n.sireneId,
        sireneName:     (n as any).sirene?.name ?? null,
        audioId:        n.alerteAudioId,
        audioName:      (n as any).alerteAudio?.name ?? null,
        souscriptionId: (n as any).souscriptionId ?? null,
        // Annulable seulement si PENDING et dans le futur
        canCancel: n.status === NotificationStatus.PENDING && scheduledAt > now,
      });
    }

    return Array.from(slots.values()).sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      return d !== 0 ? d : a.heure - b.heure;
    });
  }

  /**
   * Résumé stats pour la semaine en cours (nb envoyés, en attente, annulés)
   */
  async getWeekStats(userId?: number, customerId?: number): Promise<{
    sent: number; pending: number; failed: number; total: number;
  }> {
    const today   = new Date();
    const monday  = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const base = this.repo
      .createQueryBuilder('n')
      .where('n.type = :type', { type: 'diffusion_commerciale' })
      .andWhere('n.sending_time_after_alerte BETWEEN :from AND :to', { from: monday, to: sunday });

    if (userId)     base.andWhere('n.user_id = :uid', { uid: userId });
    if (customerId) {
      base.innerJoin('souscription', 's', 's.id = n.souscription_id AND s.customer_id = :cid',
        { cid: customerId });
    }

    const all = await base.select(['n.status']).getMany();
    const sent    = all.filter((n) => n.status === NotificationStatus.SENT).length;
    const pending = all.filter((n) => n.status === NotificationStatus.PENDING).length;
    const failed  = all.filter((n) => n.status === NotificationStatus.FAILED).length;

    return { sent, pending, failed, total: all.length };
  }

  /**
   * Annuler une diffusion PENDING.
   * On marque FAILED + observation.
   * Si la diffusion est dans le passé → refus.
   */
  async cancelDiffusion(id: number, cancelledBy: number): Promise<void> {
    const notif = await this.repo.findOne({ where: { id } });
    if (!notif) throw new NotFoundException(`Diffusion #${id} introuvable`);

    if (notif.type !== 'diffusion_commerciale') {
      throw new BadRequestException('Seules les diffusions commerciales peuvent être annulées ici');
    }
    if (notif.status !== NotificationStatus.PENDING) {
      throw new BadRequestException(`Impossible d'annuler une diffusion avec le statut "${notif.status}"`);
    }

    const scheduledAt = notif.sendingTimeAfterAlerte;
    if (!scheduledAt || scheduledAt <= new Date()) {
      throw new BadRequestException('Cette diffusion est déjà passée ou en cours — annulation impossible');
    }

    await this.repo.update(id, {
      status:      NotificationStatus.FAILED,
      observation: `Annulé par user #${cancelledBy} le ${new Date().toLocaleString('fr-FR')}`,
    });

    // TODO : si vous avez un protocole d'annulation SMS vers le cerveau, appelez-le ici
    // Ex: await this.smsService.sendCancel(notif.phoneNumber, notif.message);
  }

  /**
   * Détail complet d'une diffusion (pour le drawer)
   */
  async findOne(id: number): Promise<Notification> {
    const n = await this.repo.findOne({
      where: { id },
      relations: ['sirene', 'alerteAudio', 'user'],
    });
    if (!n) throw new NotFoundException(`Diffusion #${id} introuvable`);
    return n;
  }



  async processDuePlannings() {
    const now = new Date();

    const plannings = await this.planningRepo.find({
      where: {
        status: PlanningStatus.PLANNED,
      },
      relations: ['souscription'],
    });

    for (const plan of plannings) {
      if (plan.scheduledAt <= now) {
        await this.execute(plan);
      }
    }
  }

  async execute(plan: PlanningDiffusion) {
    try {
      // 1. créer notification
      const notif = this.notifRepo.create({
        sireneId: plan.sireneId,
        alerteAudioId: plan.alerteAudioId,
        message: plan.message ?? 'Diffusion automatique',
        status: NotificationStatus.PENDING,
        sendingTimeAfterAlerte: plan.scheduledAt,
        souscriptionId: plan.souscriptionId,
      });

      const saved = await this.notifRepo.save(notif);

      // 2. envoyer SMS
      // await this.smsService.sendSms(...);

      // 3. update planning
      await this.planningRepo.update(plan.id, {
        status: PlanningStatus.SENT,
        notificationId: saved.id,
      });

    } catch (error) {
      await this.planningRepo.update(plan.id, {
        status: PlanningStatus.FAILED,
      });
    }
  }

}