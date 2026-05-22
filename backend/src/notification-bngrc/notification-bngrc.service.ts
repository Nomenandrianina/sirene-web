import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateNotificationBngrcDto } from './dto/create-notification-bngrc.dto';
import { UpdateNotificationBngrcDto } from './dto/update-notification-bngrc.dto';
import { NotificationBngrc, NotificationBngrcStatus } from './entities/notification-bngrc.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }                    from 'typeorm';

export interface NotificationBngrcFilters {
  sireneId?:               number;
  status?:                 NotificationBngrcStatus;
  startDate?:              string;
  endDate?:                string;
  categorieAlerteBngrcId?: number;
  userId?:                 number;
  page?:                   number;
  limit?:                  number;
}

@Injectable()
export class NotificationBngrcService {
  constructor(
    @InjectRepository(NotificationBngrc)
    private readonly repo: Repository<NotificationBngrc>,
  ) {}
 
  // ── Liste paginée avec filtres — même logique que NotificationService ─────
 
  async findAll(filters: NotificationBngrcFilters = {}) {
    const {
      sireneId, status, startDate, endDate,
      categorieAlerteBngrcId, userId,
      page = 1, limit = 20,
    } = filters;
 
    const qb = this.repo
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.sirene', 'sirene')
      .leftJoinAndSelect('sirene.village', 'village')
      .leftJoinAndSelect('village.region', 'region')
      .leftJoinAndSelect('n.audioBngrc', 'audioBngrc')
      .leftJoinAndSelect('n.categorieAlerteBngrc','categorie')
      .leftJoinAndSelect('categorie.type', 'type')
      .leftJoinAndSelect('n.user', 'user')
      .leftJoinAndSelect('user.customer', 'customer') 
      .orderBy('n.createdAt', 'DESC');
 
    if (sireneId)               qb.andWhere('n.sireneId = :sireneId',                             { sireneId });
    if (status)                 qb.andWhere('n.status = :status',                                 { status });
    if (categorieAlerteBngrcId) qb.andWhere('n.categorieAlerteBngrcId = :categorieAlerteBngrcId', { categorieAlerteBngrcId });
    if (userId)                 qb.andWhere('n.userId = :userId',                                 { userId });
 
    if (startDate && endDate) {
      const start = new Date(startDate);
    
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    
      qb.andWhere('n.sendingTime BETWEEN :startDate AND :endDate', {
        startDate: start,
        endDate: end,
      });
    }
     else if (startDate) {
      qb.andWhere('n.sendingTime >= :startDate', { startDate: new Date(startDate) });
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('n.sendingTime <= :endDate',   { endDate:   new Date(end)   });
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
 
  // ── Détail ─────────────────────────────────────────────────────────────────
 
  // Service
  async findOne(id: number): Promise<NotificationBngrc> {
    if (!id || isNaN(id)) {
      throw new BadRequestException(`ID invalide`);
    }
    
    const item = await this.repo.findOne({
      where:     { id },
      relations: ['sirene', 'audioBngrc', 'categorieAlerteBngrc', 'categorieAlerteBngrc.type', 'user'],
    });
    if (!item) throw new NotFoundException(`NotificationBngrc #${id} introuvable`);
    return item;
  }
 
  // ── Stats — même format que getStats existant ─────────────────────────────

  async getStats(filters: {
    startDate?: string;
    endDate?: string;
  }) {
  
    const qb = this.repo.createQueryBuilder('n');
  
    if (filters.startDate) {
      qb.andWhere('DATE(n.sending_time) >= :startDate', {
        startDate: filters.startDate,
      });
    }
  
    if (filters.endDate) {
      qb.andWhere('DATE(n.sending_time) <= :endDate', {
        endDate: filters.endDate,
      });
    }
  
    const total = await qb.getCount();
  
    const sent = await qb.clone()
      .andWhere('n.status = :status', { status: 'sent' })
      .getCount();
  
    const failed = await qb.clone()
      .andWhere('n.status = :status', { status: 'failed' })
      .getCount();
  
    return {
      total,
      sent,
      failed,
    };
  }

 
  // async getStats(filters: Partial<NotificationBngrcFilters> = {}) {
  //   const { sireneId, categorieAlerteBngrcId, startDate, endDate } = filters;
 
  //   const qb = this.repo.createQueryBuilder('n');
 
  //   if (sireneId)               qb.andWhere('n.sireneId = :sireneId',                             { sireneId });
  //   if (categorieAlerteBngrcId) qb.andWhere('n.categorieAlerteBngrcId = :categorieAlerteBngrcId', { categorieAlerteBngrcId });
  //   if (startDate)              qb.andWhere('n.sendingTime >= :startDate',                        { startDate: new Date(startDate) });
  //   if (endDate)                qb.andWhere('n.sendingTime <= :endDate',                          { endDate:   new Date(endDate)   });
 
  //   const [total, sent, failed, pending] = await Promise.all([
  //     qb.getCount(),
  //     qb.clone().andWhere("n.status = 'sent'")    .getCount(),
  //     qb.clone().andWhere("n.status = 'failed'")  .getCount(),
  //     qb.clone().andWhere("n.status = 'pending'") .getCount(),
  //   ]);
 
  //   return { total, sent, failed, pending };
  // }
 
  // ── Suppression ────────────────────────────────────────────────────────────
 
  async remove(id: number): Promise<{ message: string }> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
    return { message: `NotificationBngrc #${id} supprimée` };
  }
}
