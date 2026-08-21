import { Injectable, NotFoundException ,Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, FindOptionsWhere } from "typeorm";
import { Notification, NotificationStatus, PlaybackAckStatus } from "./entities/notification.entity";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { UpdateNotificationStatusDto } from "./dto/update-notification.dto";
import { PlaybackAckDto } from "./dto/playback-ack.dto";
import { Notificationsweb } from "src/notificationsweb/entities/notificationsweb.entity";
import { User } from "src/users/entities/user.entity";
import { ROLES } from "src/common/constants/roles.constants";

export interface NotificationFilters {
  sireneId?: number;
  status?: NotificationStatus;
  startDate?: string;
  endDate?: string;
  sousCategorieAlerteId?: number;
  userId?: number;
  page?: number;
  limit?: number;
  customerId?: number;
}


function toMadagascarISOString(date: Date): string {
  // UTC+3 — Indian/Antananarivo
  const offset = 3 * 60; // minutes
  const local  = new Date(date.getTime() + offset * 60 * 1000);
  return local.toISOString().slice(0, 16); // "2026-04-21T15:05"
}


@Injectable()
export class NotificationService {

  private readonly logger = new Logger(NotificationService.name);

  constructor
  (@InjectRepository(Notification) private readonly repo: Repository<Notification>, 
  @InjectRepository(User) private readonly userRepo: Repository<User>,
  @InjectRepository(Notificationsweb) private readonly notifWebRepo: Repository<Notificationsweb> ) {}

  async findAll(filters: NotificationFilters = {}) {
    const { sireneId, status, startDate, endDate, sousCategorieAlerteId,  userId, customerId, page = 1, limit = 15 } = filters;
    const qb = this.repo
      .createQueryBuilder("n")
      .leftJoinAndSelect("n.sirene", "sirene")
      .leftJoinAndSelect("sirene.village", "village")
      .leftJoinAndSelect("village.region", "region")
      .leftJoinAndSelect("n.alerteAudio", "alerteAudio")
      .leftJoinAndSelect("n.sousCategorie", "sousCategorie")
      .leftJoinAndSelect("n.Customer", "customer")
      .leftJoinAndSelect("n.user", "user")
      .orderBy("n.createdAt", "DESC");

    if (sireneId)              qb.andWhere("n.sireneId = :sireneId", { sireneId });
    if (status)                qb.andWhere("n.status = :status", { status });
    if (sousCategorieAlerteId) qb.andWhere("n.sousCategorieAlerteId = :sousCategorieAlerteId", { sousCategorieAlerteId });
    if (userId)                qb.andWhere("n.userId = :userId", { userId });
    if (customerId) qb.andWhere("n.customerId = :customerId", { customerId });

    if (startDate && endDate) {
      qb.andWhere("n.sendingTime BETWEEN :startDate AND :endDate", {
        startDate: new Date(startDate),
        endDate:   new Date(endDate),
      });
    } else if (startDate) {
      qb.andWhere("n.sendingTime >= :startDate", { startDate: new Date(startDate) });
    } else if (endDate) {
      qb.andWhere("n.sendingTime <= :endDate", { endDate: new Date(endDate) });
    }

    const total = await qb.getCount();
    const data  = await qb.skip((page - 1) * limit).take(limit).getMany();

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id },
      relations: ["sirene", "alerteAudio", "sousCategorie", "user"],
    });
    if (!item) throw new NotFoundException(`Notification #${id} introuvable`);
    return item;
  }

  // Appelé uniquement en interne par le service d'envoi d'alertes
  create(dto: CreateNotificationDto) {
    return this.repo.save(this.repo.create(dto));
  }

  // Mise à jour du statut (callback Orange API)
  async updateStatus(id: number, dto: UpdateNotificationStatusDto) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { message: "Notification supprimée" };
  }

  // Stats globales pour le dashboard
  async getStats(filters: Partial<NotificationFilters> = {}) {
    const { customerId, sireneId, sousCategorieAlerteId, startDate, endDate } = filters;
  
    const buildQb = (status?: NotificationStatus) => {
      const qb = this.repo.createQueryBuilder("n");
      if (status)                qb.andWhere("n.status = :status",                { status });
      if (customerId)            qb.andWhere("n.customerId = :customerId",         { customerId });
      if (sireneId)              qb.andWhere("n.sireneId = :sireneId",             { sireneId });
      if (sousCategorieAlerteId) qb.andWhere("n.sousCategorieAlerteId = :sousCategorieAlerteId", { sousCategorieAlerteId });
      if (startDate && endDate) {
        qb.andWhere("n.sendingTime BETWEEN :startDate AND :endDate", {
          startDate: new Date(startDate), endDate: new Date(endDate),
        });
      } else if (startDate) {
        qb.andWhere("n.sendingTime >= :startDate", { startDate: new Date(startDate) });
      } else if (endDate) {
        qb.andWhere("n.sendingTime <= :endDate",   { endDate: new Date(endDate) });
      }
      return qb;
    };
  
    const [total, sent, failed, pending] = await Promise.all([
      buildQb().getCount(),
      buildQb(NotificationStatus.SENT).getCount(),
      buildQb(NotificationStatus.FAILED).getCount(),
      buildQb(NotificationStatus.PENDING).getCount(),
    ]);
  
    return { total, sent, failed, pending };
  }


  private readonly PLAYBACK_RANK: Record<PlaybackAckStatus, number> = {
    [PlaybackAckStatus.RECEIVED]: 1,
    [PlaybackAckStatus.PLAYING]:  2,
    [PlaybackAckStatus.PLAYED]:   3,
    [PlaybackAckStatus.FAILED]:   3,
    [PlaybackAckStatus.TIMEOUT]:  3,
  };
  
  async acknowledgePlayback(id: number, dto: PlaybackAckDto): Promise<{ updated: boolean }> {
    const notif = await this.repo.findOne({
      where: { id },
      relations: ['sirene', 'sousCategorie'],
    });
    if (!notif) throw new NotFoundException(`Notification #${id} introuvable`);
  
    const currentRank = notif.playbackStatus ? this.PLAYBACK_RANK[notif.playbackStatus] : 0;
    const newRank     = this.PLAYBACK_RANK[dto.status];
    if (newRank < currentRank) {
      this.logger.warn(`[IEC] Ack ignoré (régression) #${id}: ${notif.playbackStatus} → ${dto.status}`);
      return { updated: false };
    }
  
    const now = dto.timestamp ? new Date(dto.timestamp) : new Date();
    const update: Partial<Notification> = { playbackStatus: dto.status };
  
    if (dto.status === PlaybackAckStatus.RECEIVED) update.playbackReceivedAt = now;
    if (dto.status === PlaybackAckStatus.PLAYING)  update.playbackStartedAt  = now;
    if (dto.status === PlaybackAckStatus.PLAYED)   update.playbackEndedAt    = now;
    if (dto.status === PlaybackAckStatus.FAILED) {
      update.playbackEndedAt = now;
      update.playbackError   = dto.errorReason?.slice(0, 255) ?? null;
    }
  
    await this.repo.update(id, update);
  
    // ── Notif cloche web — uniquement sur statut terminal (succès ou échec) ───
    if (dto.status === PlaybackAckStatus.PLAYED || dto.status === PlaybackAckStatus.FAILED) {
      await this.createIecPlaybackNotifWeb({
        customerId:    notif.customerId,
        sireneName:    notif.sirene?.name ?? notif.sirene?.imei ?? `#${notif.sireneId}`,
        sousCategName: notif.sousCategorie?.name ?? '',
        success:       dto.status === PlaybackAckStatus.PLAYED,
        timestamp:     now,
      });
    }
  
    return { updated: true };
  }
  
  // ── Notif cloche — SUPERADMIN + CUSTOMER_ADMIN/CUSTOMER_OPERATOR du même client ─
  private async createIecPlaybackNotifWeb(params: {customerId:    number | null; sireneName: string; sousCategName: string; success: boolean; timestamp: Date;}): Promise<void> {
    const { customerId, sireneName, sousCategName, success, timestamp } = params;
  
    // 1. SUPERADMIN — voit toutes les diffusions, peu importe le client
    const superAdmins = await this.userRepo
      .createQueryBuilder('u')
      .leftJoin('u.role', 'r')
      .where('r.name = :role', { role: ROLES.SUPERADMIN })
      .andWhere('u.deletedAt IS NULL')
      .getMany();
  
    // 2. CUSTOMER_ADMIN / CUSTOMER_OPERATOR — uniquement ceux du client concerné
    let customerUsers: User[] = [];
    if (customerId) {
      customerUsers = await this.userRepo
        .createQueryBuilder('u')
        .leftJoin('u.role', 'r')
        .where('r.name IN (:...roles)', { roles: [ROLES.CUSTOMER_ADMIN, ROLES.CUSTOMER_OPERATOR] })
        .andWhere('u.customer_id = :customerId', { customerId })
        .andWhere('u.deletedAt IS NULL')
        .getMany();
    }
  
    // 3. Fusion + dédoublonnage (au cas où un superadmin aurait aussi un customerId)
    const targetsMap = new Map<number, User>();
    [...superAdmins, ...customerUsers].forEach(u => targetsMap.set(u.id, u));
    const targets = Array.from(targetsMap.values());
  
    if (!targets.length) return;
  
    const madagascarISO = toMadagascarISOString(timestamp);
    const [datePart, timePart] = madagascarISO.split('T');
    const [mdgYear, mdgMonth, mdgDay] = datePart.split('-');
    const dateLabel = `${mdgDay}/${mdgMonth}/${mdgYear}`;
  
    const label       = sousCategName || 'Diffusion';
    const statusLabel = success ? 'diffusée avec succès' : 'non diffusée (échec)';
    const mainText    = `${label} — Sirène ${sireneName} — ${statusLabel} — ${dateLabel} à ${timePart}`;
    const message     = [mainText, '', ''].join('||');
  
    const notifs = targets.map(user => {
      const n      = new Notificationsweb();
      n.type       = success ? 'IEC_PLAYBACK_SUCCESS' : 'IEC_PLAYBACK_FAILED';
      n.message    = message;
      n.entityType = 'notification_sirene_alerte';
      n.url        = '/notifications-alerte'; 
      n.isRead     = false;
      n.userId     = user.id;
      return n;
    });
  
    await this.notifWebRepo.save(notifs);
  }
  
}