import { Injectable, NotFoundException, BadRequestException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Souscription, SouscriptionStatus } from '@/souscription/entities/souscription.entity';
import { PackType, Periode } from '@/packtype/entities/packtype.entity';
import { CreateSouscriptionDto, UpdateSouscriptionDto, SouscriptionQueryDto,} from '@/souscription/dto/create-souscription.dto';
import { Notification } from '@/notification/entities/notification.entity';
import { AlerteAudio } from '@/alerte-audio/entities/alerte-audio.entity';
import { DiffusionPlanifieeService } from 'src/diffusion-planifiee/diffusion-planifiee.service';
import { Notificationsweb } from 'src/notificationsweb/entities/notificationsweb.entity';
import { User }             from 'src/users/entities/user.entity';
import { SouscriptionSireneService } from 'src/souscription-sirene/souscription-sirene.service';
import { SouscriptionSirene } from 'src/souscription-sirene/entities/souscription-sirene.entity';

@Injectable()
export class SouscriptionService {
  constructor(
    @InjectRepository(Souscription)
    private readonly repo: Repository<Souscription>,
    @InjectRepository(PackType)
    private readonly packRepo: Repository<PackType>,

    private readonly planifieeService: DiffusionPlanifieeService,

    @InjectRepository(Notificationsweb)
    private readonly notifWebRepo: Repository<Notificationsweb>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(SouscriptionSirene)
    private readonly souscriptionSireneRepo: Repository<SouscriptionSirene>,

  ) {}

  // ── CREATE ──────────────────────────────────────────────────────────────────

  async create(dto: CreateSouscriptionDto): Promise<Souscription> {
    const pack = await this.packRepo.findOne({ where: { id: dto.packTypeId, isActive: true } });
    if (!pack) throw new NotFoundException('Pack introuvable');
    if (!dto.sireneIds?.length) throw new BadRequestException('Au moins une sirène requise');
  
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDate   = this.calculateEndDate(startDate, pack);
  
    const souscription = this.repo.create({
      userId:       dto.userId,
      customerId:   dto.customerId,
      packTypeId:   dto.packTypeId,
      alerteAudioId: null,
      startDate,
      endDate,
      status:       SouscriptionStatus.ACTIVE,
    });
    const saved = await this.repo.save(souscription);
  
    // ── Chaque sirène reçoit son propre pool de crédits, initialisé depuis le pack ──
    const souscriptionSirenes = dto.sireneIds.map((sireneId) =>
      this.souscriptionSireneRepo.create({
        souscriptionId:  saved.id,
        sireneId,
        nombreCredits:   pack.nombreCredits ?? null,
        creditsRestants: pack.nombreCredits ?? null,
      }),
    );
    await this.souscriptionSireneRepo.save(souscriptionSirenes);
  
    await this.notifyClientUsers(dto.customerId, saved.id, pack.name);
  
    return this.findOne(saved.id);
  }
   


  // async create(dto: CreateSouscriptionDto): Promise<Souscription> {
  //   const pack = await this.packRepo.findOne({
  //     where: { id: dto.packTypeId, isActive: true },
  //   });
  //   if (!pack) throw new NotFoundException('Pack introuvable');
  //   if (!dto.sireneIds?.length) throw new BadRequestException('Au moins une sirène requise');
 
  //   const startDate = dto.startDate ? new Date(dto.startDate) : new Date();
  //   const endDate   = this.calculateEndDate(startDate, pack);
 
  //   const souscription = this.repo.create({
  //     userId:      dto.userId,
  //     customerId:  dto.customerId,
  //     packTypeId:  dto.packTypeId,
  //     alerteAudioId: null,
  //     startDate,
  //     endDate,
  //     status: SouscriptionStatus.ACTIVE,
  //     sirenes: dto.sireneIds.map((id) => ({ id })),
  //   });
 
  //   const saved = await this.repo.save(souscription);
    
 
  //   // Générer le planning immédiatement après création
  //   const withRelations = await this.repo.findOne({ where: { id: saved.id }, relations: ['packType', 'sirenes'],  });
  //   if (withRelations) {
  //     await this.planifieeService.generateForSouscription(withRelations);
  //   }
 
  //   return saved;
  // }


  private toResponse(s: Souscription) {
    return {
      ...s,
      sirenes: (s.souscriptionSirenes ?? []).map(ss => ({
        id:              ss.sirene?.id,
        name:            ss.sirene?.name,
        village:         ss.sirene?.village,
        creditsRestants: ss.creditsRestants,
        nombreCredits:   ss.nombreCredits,
      })),
    };
  }

  // ── READ ─────────────────────────────────────────────────────────────────────

  async findAll(query: SouscriptionQueryDto): Promise<any[]> {
    const where: any = {};
    if (query.userId)     where.userId     = query.userId;
    if (query.customerId) where.customerId = query.customerId;
    if (query.status)     where.status     = query.status;
  
    const list = await this.repo.find({
      where,
      relations: [
        'packType',
        'souscriptionSirenes',
        'souscriptionSirenes.sirene',
        'souscriptionSirenes.sirene.village',
        'diffusionLogs',
        'customer',
      ],
      order: { createdAt: 'DESC' },
    });
  
    return list.map(s => this.toResponse(s));
  }

  async findOne(id: number): Promise<Souscription> {
    const s = await this.repo.findOne({
      where: { id },
      relations: ['packType', 'souscriptionSirenes', 'souscriptionSirenes.sirene', 'diffusionLogs'],
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
      // s.sirenes = dto.sireneIds.map((sid) => ({ id: sid })) as any[];
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
    switch (pack.periode) {
      case Periode.YEARLY:
        end.setFullYear(end.getFullYear() + 1);
        break;
      case Periode.MONTHLY:
        end.setMonth(end.getMonth() + 1);
        break;
      case Periode.WEEKLY:
      default:
        end.setDate(end.getDate() + 7);
        break;
    }
    return end;
  }

  // private enrichWithStats(s: Souscription): SouscriptionWithStats {
  //   const today       = new Date();
  //   const endDate     = new Date(s.endDate);
  //   const joursRestants = Math.max(
  //     0,
  //     Math.ceil((endDate.getTime() - today.getTime()) / 86_400_000),
  //   );
  //   return {
  //     ...s,
  //     joursRestants,
  //     estExpire: today > endDate,
  //     dateFinFormatee: endDate.toLocaleDateString('fr-FR'),
  //   };
  // }

  private enrichWithStats(s: Souscription): SouscriptionWithStats {
    const today         = new Date();
    const endDate       = new Date(s.endDate);
    const joursRestants = Math.max(
      0,
      Math.ceil((endDate.getTime() - today.getTime()) / 86_400_000),
    );
    return {
      ...s,
      joursRestants,
      estExpire:       today > endDate,
      dateFinFormatee: endDate.toLocaleDateString('fr-FR'),
      // creditsRestants est déjà dans ...s car c'est une colonne de l'entité
    };
  }


  /**
   * Décrémente de 1 le crédit d'une souscription.
   * Appelé par DiffusionPlanifieeService lors de l'ajout d'une ligne de planning.
   * Lance BadRequestException si crédits épuisés.
   * Ne fait rien si creditsRestants = null (illimité).
  */
  async decrementCredit(souscriptionId: number): Promise<void> {
    const s = await this.repo.findOne({ where: { id: souscriptionId } });
    if (!s) throw new NotFoundException(`Souscription #${souscriptionId} introuvable`);
 
    // null = illimité → pas de décrément
    if (s.creditsRestants === null) return;
 
    if (s.creditsRestants <= 0) {
      throw new BadRequestException(
        'Crédits épuisés — impossible d\'ajouter une diffusion',
      );
    }
 
    await this.repo.update(souscriptionId, {
      creditsRestants: s.creditsRestants - 1,
    });
  }
 
  /**
   * Restitue 1 crédit lors de l'annulation d'une diffusion planifiée.
   * Ne fait rien si creditsRestants = null (illimité).
   */
  async restituerCredit(souscriptionId: number): Promise<void> {
    const s = await this.repo.findOne({ where: { id: souscriptionId } });
    if (!s) throw new NotFoundException(`Souscription #${souscriptionId} introuvable`);
 
    // null = illimité → pas de restitution
    if (s.creditsRestants === null) return;
 
    await this.repo.update(souscriptionId, {
      creditsRestants: s.creditsRestants + 1,
    });
  }


  
  // ── Nouvelle méthode privée à ajouter dans SouscriptionService ──────────────
  private async notifyClientUsers( customerId: number, souscriptionId: number, packName: string,): Promise<void> {
    // Charger tous les users du client avec rôle CUSTOMER_ADMIN ou CUSTOMER_OPERATOR
    console.log("client_id :",customerId);
    const targets = await this.userRepo
      .createQueryBuilder('u')
      .leftJoin('u.role', 'r')
      .where('u.customer_id = :cid', { cid: customerId })
      .andWhere('r.name IN (:...roles)', {
        roles: ['CUSTOMER_ADMIN', 'CUSTOMER_OPERATOR'],
      })
      .andWhere('u.deletedAt IS NULL')
      .getMany();
  
    if (!targets.length) return;
  
    const mainText = `Nouvelle souscription — Pack ${packName} activé pour votre compte`;
    // Format compatible parseMessage frontend : "texte||userName||customerName"
    const message = mainText;
      
    const notifs = targets.map(user => {
      const n      = new Notificationsweb();
      n.type       = 'SOUSCRIPTION_CREATED';
      n.message    = message;
      n.entityType = 'souscription';
      n.entityId   = souscriptionId;
      n.url        = '/planning-customer';
      n.isRead     = false; 
      n.userId     = user.id;
      return n;
    });
  
    await this.notifWebRepo.save(notifs);
  }
  

  async decrementCreditForSirene(souscriptionId: number, sireneId: number): Promise<void> {
    const ss = await this.souscriptionSireneRepo.findOne({
      where: { souscriptionId, sireneId },
    });
    if (!ss) throw new NotFoundException('Association souscription/sirène introuvable');
    if (ss.creditsRestants !== null) {
      if (ss.creditsRestants <= 0) {
        throw new BadRequestException('Crédits épuisés pour cette sirène');
      }
      ss.creditsRestants -= 1;
      await this.souscriptionSireneRepo.save(ss);
    }
  }

  async restoreCreditForSirene(souscriptionId: number, sireneId: number): Promise<void> {
    const ss = await this.souscriptionSireneRepo.findOne({
      where: { souscriptionId, sireneId },
    });
    if (ss && ss.creditsRestants !== null) {
      ss.creditsRestants += 1;
      await this.souscriptionSireneRepo.save(ss);
    }
  }
 

}

export interface SouscriptionWithStats extends Souscription {
  joursRestants: number;
  estExpire: boolean;
  dateFinFormatee: string;
}