import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, FindOptionsWhere } from "typeorm";
import { Notification, NotificationStatus } from "./entities/notification.entity";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { UpdateNotificationStatusDto } from "./dto/update-notification.dto";

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

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

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
}