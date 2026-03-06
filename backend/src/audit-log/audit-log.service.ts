import { Injectable } from '@nestjs/common';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { AuditLog } from './entity/audit-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  /** Crée une entrée d'audit (utilisé en interne ou via le contrôleur) */
  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    const entry = this.repo.create({ ...dto, date: new Date() });
    return this.repo.save(entry);
  }

  /** Liste avec filtres optionnels */
  async findAll(filters?: {
    userId?: number;
    entity?: string;
    action?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ data: AuditLog[]; total: number }> {
    const { userId, entity, action, from, to, page = 1, limit = 20 } = filters ?? {};

    const qb = this.repo.createQueryBuilder('al')
      .leftJoinAndSelect('al.user', 'user')
      .orderBy('al.date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (userId)  qb.andWhere('al.user_id = :userId', { userId });
    if (entity)  qb.andWhere('al.entity  = :entity',  { entity });
    if (action)  qb.andWhere('al.action  = :action',  { action });
    if (from)    qb.andWhere('al.date   >= :from',     { from });
    if (to)      qb.andWhere('al.date   <= :to',       { to });

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOne(id: number): Promise<AuditLog> {
    return this.repo.findOneOrFail({ where: { id }, relations: ['user'] });
  }
}
