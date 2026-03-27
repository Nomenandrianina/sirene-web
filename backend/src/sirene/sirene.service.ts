import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Sirene }          from './entities/sirene.entity';
import { Customer }        from '../customers/entity/customer.entity';
import { CreateSireneDto } from './dto/create-sirene.dto';
import { UpdateSireneDto } from './dto/update-sirene.dto';

@Injectable()
export class SirenesService {
  constructor(
    @InjectRepository(Sirene)
    private readonly sireneRepo: Repository<Sirene>,

    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,

  ) {}

  // ── CRUD ──────────────────────────────────────────────────────────────

  async findAll(isSuperAdmin: boolean, customerId?: number) {
    const qb = this.sireneRepo.createQueryBuilder('s')
      .leftJoinAndSelect('s.village',   'village')
      .leftJoinAndSelect('s.customers', 'customers')
      .where('s.deleted_at IS NULL');

    // Client : filtre sur ses sirènes via pivot
    if (!isSuperAdmin && customerId) {
      qb.innerJoin('s.customers', 'c', 'c.id = :cid', { cid: customerId });
    }

    return qb.getMany();
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
      name:             dto.name,
      imei:             dto.imei,
      latitude:         dto.latitude,
      longitude:        dto.longitude,
      phoneNumberBrain: dto.phoneNumberBrain,
      phoneNumberRelai: dto.phoneNumberRelai,
      villageId:        dto.villageId,
      isActive:         dto.isActive ?? 1,
    });

    if (dto.customerIds?.length) {
      sirene.customers = await this.customerRepo.findBy({ id: In(dto.customerIds) });
    }

    const saved = await this.sireneRepo.save(sirene);
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
 

  // ── Historique alertes ────────────────────────────────────────────────
  // Retourne les logs d'audit de type alerte pour cette sirène
}