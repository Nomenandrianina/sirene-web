import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Sirene }          from './entities/sirene.entity';
import { Customer }        from '../customers/entity/customer.entity';
import { CreateSireneDto } from './dto/create-sirene.dto';
import { UpdateSireneDto } from './dto/update-sirene.dto';
import { AudioAlerteBngrc } from 'src/audio-alerte-bngrc/entities/audio-alerte-bngrc.entity';
import { ROLES } from 'src/common/constants/roles.constants';
import { User } from 'src/users/entities/user.entity';
import { Notificationsweb } from 'src/notificationsweb/entities/notificationsweb.entity';
import { Village } from 'src/villages/entities/village.entity';

@Injectable()
export class SirenesService {
  constructor(
  @InjectRepository(Sirene)
  private readonly sireneRepo: Repository<Sirene>,

  @InjectRepository(User)
  private readonly userRepository: Repository<User>,

  @InjectRepository(Customer)
  private readonly customerRepo: Repository<Customer>,
  
  @InjectRepository(AudioAlerteBngrc)
  private readonly audioAlerteBngrcRepo: Repository<AudioAlerteBngrc>,

  @InjectRepository(Notificationsweb)
  private readonly notificationsWebRepository: Repository<Notificationsweb>,

  @InjectRepository(Village)
  private readonly villageRepository: Repository<Village>,

  ) {}

  // ── CRUD ──────────────────────────────────────────────────────────────

  async findAll(isSuperAdmin: boolean, customerId?: number) {
    const qb = this.sireneRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.village',   'village')
      .leftJoinAndSelect('village.district', 'district')    
      .leftJoinAndSelect('s.customers', 'customers')
      .where('s.deleted_at IS NULL');

    // Client : filtre sur ses sirènes via pivot
    if (!isSuperAdmin && customerId) {
      qb.innerJoin('s.customers', 'c', 'c.id = :cid', { cid: customerId });
    }

    return qb.getMany();
  }

  async findAllWithoutfilter(): Promise<Sirene[]> {
    return this.sireneRepo.find({
      relations: [
        'village',
        'village.fokontany',
        'village.fokontany.commune',
        'village.fokontany.commune.district',
        'village.fokontany.commune.district.region',
        'village.fokontany.commune.district.region.province',
        'customers',
      ],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number) {
    const s = await this.sireneRepo.findOne({
      where:     { id },
      relations: ['village', 'village.district', 'customers'],
    });
    if (!s) throw new NotFoundException(`Sirène #${id} introuvable`);
    return s;
  }

  async create(dto: CreateSireneDto, userId: number) {

    const sirene = this.sireneRepo.create({
      name:              dto.name,
      imei:              dto.imei,
      latitude:          dto.latitude,
      longitude:         dto.longitude,
      phoneNumberBrain:  dto.phoneNumberBrain,
      phoneNumberRelai:  dto.phoneNumberRelai,
      villageId:         dto.villageId,
      isActive:          dto.isActive,
      communicationType: dto.communicationType,
      fcmToken:          dto.fcmToken ?? null,
    });
  
    if (dto.customerIds?.length) {
      sirene.customers = await this.customerRepo.findBy({ id: In(dto.customerIds) });
    }
  
    const saved = await this.sireneRepo.save(sirene);
  
    // ─── Assigner la nouvelle sirène à tous les AudioAlerteBngrc existants ───
    const allAudios = await this.audioAlerteBngrcRepo.find({
      relations: ['sirenes'],
    });
  
    if (allAudios.length) {
      for (const audio of allAudios) {
        const alreadyAssigned = audio.sirenes.some(s => s.id === saved.id);
        if (!alreadyAssigned) {
          audio.sirenes.push(saved);
        }
      }
      await this.audioAlerteBngrcRepo.save(allAudios);
    }
  
    return saved;
  }

  async update(id: number, dto: UpdateSireneDto, userId: number) {
    const sirene = await this.findOne(id);
    const old    = { ...sirene };

    Object.assign(sirene, {
      name:             dto.name             ?? sirene.name,
      imei:             dto.imei             ?? sirene.imei,
      latitude:         dto.latitude         ?? sirene.latitude,
      longitude:        dto.longitude        ?? sirene.longitude,
      phoneNumberBrain: dto.phoneNumberBrain ?? sirene.phoneNumberBrain,
      phoneNumberRelai: dto.phoneNumberRelai ?? sirene.phoneNumberRelai,
      villageId:        dto.villageId        ?? sirene.villageId,
      isActive:         dto.isActive         ?? sirene.isActive,
      communicationType:         dto.communicationType         ?? sirene.communicationType,
      fcmToken: dto.fcmToken !== undefined ? dto.fcmToken : sirene.fcmToken,
    });

    if (dto.customerIds !== undefined) {
      sirene.customers = dto.customerIds.length
        ? await this.customerRepo.findBy({ id: In(dto.customerIds) })
        : [];
    }

    const saved = await this.sireneRepo.save(sirene);
    return saved;
  }

  async remove(id: number, userId: number) {
    const sirene = await this.findOne(id);
    await this.sireneRepo.delete(id);
    return { message: `Sirène #${id} supprimée` };
  }


  async findSireneByImei(imei: string) {
    return this.sireneRepo.findOne({
      where: { imei },
    });
  }
 

  async findAllForMap(isGlobalViewer: boolean, customerId?: number) {
    const sirenes = await this.sireneRepo.find({
      relations: [
        'customers',
        'village',
        'village.fokontany',
        'village.commune',
        'village.district',
        'village.region',
        'village.province',
      ],
    });
  
    return sirenes.map((s) => {
      const isOwned = isGlobalViewer
        ? true
        : s.customers?.some(c => c.id === customerId);
  
      return {
        id:          s.id,
        name:        s.name,
        imei:        s.imei,
        latitude:    s.latitude,
        longitude:   s.longitude,
        isActive:    !!s.isActive,
        isOwned,
        village: s.village ? {
          id:   s.village.id,
          name: s.village.name,
          fokontany: s.village.fokontany ? {
            id:   s.village.fokontany.id,
            name: s.village.fokontany.name,
          } : null,
          commune: s.village.commune ? {
            id:   s.village.commune.id,
            name: s.village.commune.name,
          } : null,
          district: s.village.district ? {
            id:   s.village.district.id,
            name: s.village.district.name,
          } : null,
          region: s.village.region ? {
            id:         s.village.region.id,
            name:       s.village.region.name,
            provinceId: s.village.region.province?.id ?? null,
          } : null,
          province: s.village.province ? {
            id:   s.village.province.id,
            name: s.village.province.name,
          } : null,
        } : null,
      };
    });
  }


  async updateFcmToken(imei: string, fcmToken: string): Promise<void> {
    const sirene = await this.sireneRepo.findOne({ where: { imei } });
    if (!sirene) throw new NotFoundException(`Sirène avec IMEI ${imei} introuvable`);
  
    sirene.fcmToken = fcmToken;
    await this.sireneRepo.save(sirene);
    
  }

  async findByCustomer(customerId: number) {
    const sirenes = await this.sireneRepo.find({
      relations: [
        'customers',
        'village',
        'village.fokontany',
        'village.commune',
        'village.district',
        'village.region',
        'village.province',
      ],
      where: {
        customers: { id: customerId },
      },
    });
   
    return sirenes.map((s) => ({
      id:                s.id,
      name:              s.name,
      imei:              s.imei,
      latitude:          s.latitude,
      longitude:         s.longitude,
      isActive:          !!s.isActive,
      phoneNumberBrain:  s.phoneNumberBrain  ?? null,
      phoneNumberRelai:  s.phoneNumberRelai  ?? null,
      communicationType: s.communicationType ?? null,
      customers: s.customers?.map(c => ({ id: c.id, name: c.name })) ?? [],
      village: s.village ? {
        id:   s.village.id,
        name: s.village.name,
        fokontany: s.village.fokontany ? {
          id:   s.village.fokontany.id,
          name: s.village.fokontany.name,
          commune: s.village.fokontany.commune ? {
            id:   s.village.fokontany.commune.id,
            name: s.village.fokontany.commune.name,
          } : null,
        } : null,
        district: s.village.district ? {
          id:   s.village.district.id,
          name: s.village.district.name,
        } : null,
        region: s.village.region ? {
          id:         s.village.region.id,
          name:       s.village.region.name,
          provinceId: s.village.region.province?.id ?? null,
        } : null,
        province: s.village.province ? {
          id:   s.village.province.id,
          name: s.village.province.name,
        } : null,
      } : null,
    }));
  }
   
  

  async registerOrUpdateSirene(
    imei: string,
    fcmToken: string,
  ): Promise<{ created: boolean; sireneId: number }> {
    const existing = await this.sireneRepo.findOne({ where: { imei } });
  
    if (existing) {
      // Si imei + fcmToken sont identiques, rien à faire
      if (existing.fcmToken === fcmToken) {
        return { created: false, sireneId: existing.id };
      }
  
      // fcmToken a changé → on met à jour
      await this.sireneRepo.update(existing.id, { fcmToken });
      return { created: false, sireneId: existing.id };
    }
  
    // Récupérer un village existant par défaut (le dernier créé)
    const defaultVillage = await this.villageRepository.findOne({
      where: {},
      order: { id: 'DESC' },
    });
  
    if (!defaultVillage) {
      throw new InternalServerErrorException(
        'Aucun village disponible en base pour assigner la nouvelle sirène',
      );
    }
  
    // Générer le name : "Village-01", "Village-02", ...
    const generatedName = await this.generateSireneName(defaultVillage.name);
  
    const newSirene = this.sireneRepo.create({
      imei,
      fcmToken,
      name: generatedName,
      villageId: defaultVillage.id,
      isActive: 0,
      communicationType: 'DATA',
    });
  
    const saved = await this.sireneRepo.save(newSirene);

     // ─── Assigner la nouvelle sirène à tous les AudioAlerteBngrc existants ───
    const allAudios = await this.audioAlerteBngrcRepo.find({
      relations: ['sirenes'],
    });
  
    if (allAudios.length) {
      for (const audio of allAudios) {
        const alreadyAssigned = audio.sirenes.some(s => s.id === saved.id);
        if (!alreadyAssigned) {
          audio.sirenes.push(saved);
        }
      }
      await this.audioAlerteBngrcRepo.save(allAudios);
    }
  
    await this.notifySuperadmins(saved);
  
    return { created: true, sireneId: saved.id };
  }

  private async notifySuperadmins(sirene: Sirene): Promise<void> {
    // Récupérer tous les superadmins
    const superadmins = await this.userRepository.find({
      where: { role: { name: ROLES.SUPERADMIN } },
      relations: ['role'],
    });

    if (!superadmins.length) return;

    const notifications = superadmins.map((admin) =>
      this.notificationsWebRepository.create({
        type: 'SIRENE_REGISTERED',
        message: `Nouvelle sirène enregistrée avec l'IMEI ${sirene.imei}. Configuration requise.`,
        entityType: 'sirene',
        entityId: sirene.id,
        url: `/sirenes/${sirene.id}`,
        isRead: false,
        userId: admin.id,
      }),
    );

    await this.notificationsWebRepository.save(notifications);
  }


  private async generateSireneName(villageName: string): Promise<string> {
    const count = await this.sireneRepo.count({
      where: { villageId: (await this.villageRepository.findOne({ where: { name: villageName } }))?.id },
    });
  
    const nextNumber = count + 1;
    const paddedNumber = String(nextNumber).padStart(2, '0');
  
    return `${villageName}-${paddedNumber}`;
  }

  // ── Historique alertes ────────────────────────────────────────────────
  // Retourne les logs d'audit de type alerte pour cette sirène
}