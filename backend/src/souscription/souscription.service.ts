import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Souscription, SouscriptionStatus } from '@/souscription/entities/souscription.entity';
import { PackType, Periode } from '@/packtype/entities/packtype.entity';
import {
  CreateSouscriptionDto,
  UpdateSouscriptionDto,
  SouscriptionQueryDto,
} from '@/souscription/dto/create-souscription.dto';
import { Notification } from '@/notification/entities/notification.entity';
import { AlerteAudio } from '@/alerte-audio/entities/alerte-audio.entity';
import { DiffusionPlanifieeService } from 'src/diffusion-planifiee/diffusion-planifiee.service';

@Injectable()
export class SouscriptionService {
  constructor(
    @InjectRepository(Souscription)
    private readonly repo: Repository<Souscription>,
    @InjectRepository(PackType)
    private readonly packRepo: Repository<PackType>,

    private readonly planifieeService: DiffusionPlanifieeService,

  ) {}

  // ── CREATE ──────────────────────────────────────────────────────────────────

  async create(dto: CreateSouscriptionDto): Promise<Souscription> {
    const pack = await this.packRepo.findOne({
      where: { id: dto.packTypeId, isActive: true },
    });
    if (!pack) throw new NotFoundException('Pack introuvable');
    if (!dto.sireneIds?.length) throw new BadRequestException('Au moins une sirène requise');
 
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate   = this.calculateEndDate(startDate, pack);
 
    const souscription = this.repo.create({
      userId:      dto.userId,
      customerId:  dto.customerId,
      packTypeId:  dto.packTypeId,
      alerteAudioId: null,
      startDate,
      endDate,
      status: SouscriptionStatus.ACTIVE,
      sirenes: dto.sireneIds.map((id) => ({ id })),
    });
 
    const saved = await this.repo.save(souscription);
 
    // Générer le planning immédiatement après création
    const withRelations = await this.repo.findOne({
      where: { id: saved.id },
      relations: ['packType', 'sirenes'],
    });
    if (withRelations) {
      await this.planifieeService.generateForSouscription(withRelations);
    }
 
    return saved;
  }

  // ── READ ─────────────────────────────────────────────────────────────────────

  async findAll(query: SouscriptionQueryDto): Promise<Souscription[]> {
    const where: any = {};
    if (query.userId)     where.userId     = query.userId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.status)     where.status     = query.status;

    return this.repo.find({
      where,
      relations: ['packType', 'sirenes', 'diffusionLogs'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Souscription> {
    const s = await this.repo.findOne({
      where: { id },
      relations: ['packType', 'sirenes', 'diffusionLogs'],
    });
    if (!s) throw new NotFoundException(`Souscription #${id} introuvable`);
    return s;
  }

  /** Vue client enrichie avec stats (jours restants, etc.) */
  async findByUser(userId: number): Promise<SouscriptionWithStats[]> {
    const subs = await this.repo.find({
      where: { userId },
      relations: ['packType', 'sirenes'],
      order: { createdAt: 'DESC' },
    });
    return subs.map((s) => this.enrichWithStats(s));
  }

  /** Vue par customer (pour superadmin) */
  async findByCustomer(customerId: number): Promise<SouscriptionWithStats[]> {
    const subs = await this.repo.find({
      where: { customerId },
      relations: ['packType', 'sirenes'],
      order: { createdAt: 'DESC' },
    });
    return subs.map((s) => this.enrichWithStats(s));
  }

  /** Souscriptions actives pour un créneau — utilisé par le scheduler */
  async findActiveForCreneau(heure: number): Promise<Souscription[]> {
    const today   = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const jourISO  = today.getDay() === 0 ? 7 : today.getDay();

    const subs = await this.repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.packType', 'pack')
      .leftJoinAndSelect('s.sirenes', 'sirene')
      .where('s.status = :status', { status: SouscriptionStatus.ACTIVE })
      .andWhere('DATE(s.start_date) <= :today', { today: todayStr })
      .andWhere('DATE(s.end_date)   >= :today', { today: todayStr })
      .getMany();

    const creneaux = [7, 12, 16];

    return subs.filter((s) => {
      const pack = s.packType;
      const creneauxAutorises = creneaux.slice(0, pack.frequenceParJour);
      if (!creneauxAutorises.includes(heure)) return false;
      if (pack.joursAutorises?.length && !pack.joursAutorises.includes(jourISO)) return false;
      return true;
    });
  }

  // ── UPDATE / ACTIONS ─────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateSouscriptionDto): Promise<Souscription> {
    const s = await this.findOne(id);
    if (dto.sireneIds) {
      s.sirenes = dto.sireneIds.map((sid) => ({ id: sid })) as any[];
    }
    Object.assign(s, {
      status:    dto.status    ?? s.status,
      packTypeId: dto.packTypeId ?? s.packTypeId,
    });
    return this.repo.save(s);
  }

  async suspend(id: number): Promise<Souscription> {
    const s = await this.findOne(id);
    s.status = SouscriptionStatus.SUSPENDED;
    return this.repo.save(s);
  }

  async reactivate(id: number): Promise<Souscription> {
    const s = await this.findOne(id);
    if (new Date() > new Date(s.endDate)) {
      throw new BadRequestException('Souscription expirée — impossible de réactiver');
    }
    s.status = SouscriptionStatus.ACTIVE;
    return this.repo.save(s);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }

  /** Expirer automatiquement les souscriptions dépassées (cron nocturne) */
  async expireOutdated(): Promise<number> {
    const todayStr = new Date().toISOString().split('T')[0];
    const result = await this.repo
      .createQueryBuilder()
      .update(Souscription)
      .set({ status: SouscriptionStatus.EXPIRED })
      .where('status = :status', { status: SouscriptionStatus.ACTIVE })
      .andWhere('DATE(end_date) < :today', { today: todayStr })
      .execute();
    return result.affected ?? 0;
  }

  /** Vérifie si un customer a au moins une souscription active */
  async hasActiveSouscription(customerId: number): Promise<boolean> {
    const count = await this.repo.count({
      where: { customerId, status: SouscriptionStatus.ACTIVE },
    });
    return count > 0;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private calculateEndDate(startDate: Date, pack: PackType): Date {
    const end = new Date(startDate);
    if (pack.periode === Periode.MONTHLY) {
      end.setMonth(end.getMonth() + 1);
    } else {
      end.setDate(end.getDate() + 7);
    }
    return end;
  }

  private enrichWithStats(s: Souscription): SouscriptionWithStats {
    const today       = new Date();
    const endDate     = new Date(s.endDate);
    const joursRestants = Math.max(
      0,
      Math.ceil((endDate.getTime() - today.getTime()) / 86_400_000),
    );
    return {
      ...s,
      joursRestants,
      estExpire: today > endDate,
      dateFinFormatee: endDate.toLocaleDateString('fr-FR'),
    };
  }
}

export interface SouscriptionWithStats extends Souscription {
  joursRestants: number;
  estExpire: boolean;
  dateFinFormatee: string;
}