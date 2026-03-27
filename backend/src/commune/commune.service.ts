import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commune } from './entities/commune.entity';
import { CreateCommuneDto } from './dto/create-commune.dto';
import { UpdateCommuneDto } from './dto/update-commune.dto';
import { District } from '@/districts/entities/district.entity';

@Injectable()
export class CommunesService {
  constructor(
    @InjectRepository(Commune)
    private readonly communeRepo: Repository<Commune>,

    @InjectRepository(District)
    private readonly districtRepo: Repository<District>,
  ) {}

  // ─── CREATE ──────────────────────────────────────────────────────────────

  async create(dto: CreateCommuneDto): Promise<Commune> {
    const district = await this.districtRepo.findOne({
      where: { id: dto.districtId },
    });
    if (!district) {
      throw new NotFoundException(`District #${dto.districtId} introuvable`);
    }

    const commune = this.communeRepo.create({
      name: dto.name,
      districtId: dto.districtId,
    });
    return this.communeRepo.save(commune);
  }

  // ─── READ ALL ─────────────────────────────────────────────────────────────

  async findAll(): Promise<Commune[]> {
    return this.communeRepo.find({
      order: { name: 'ASC' },
    });
  }

  // ─── READ BY DISTRICT ─────────────────────────────────────────────────────

  async findByDistrict(districtId: number): Promise<Commune[]> {
    return this.communeRepo.find({
      where: { districtId },
      order: { name: 'ASC' },
    });
  }

  // ─── READ ONE ─────────────────────────────────────────────────────────────

  async findOne(id: number): Promise<Commune> {
    const commune = await this.communeRepo.findOne({ where: { id } });
    if (!commune) {
      throw new NotFoundException(`Commune #${id} introuvable`);
    }
    return commune;
  }

  // ─── UPDATE ──────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateCommuneDto): Promise<Commune> {
    const commune = await this.findOne(id);

    if (dto.districtId !== undefined) {
      const district = await this.districtRepo.findOne({
        where: { id: dto.districtId },
      });
      if (!district) {
        throw new NotFoundException(`District #${dto.districtId} introuvable`);
      }
      commune.districtId = dto.districtId;
    }

    if (dto.name !== undefined) {
      commune.name = dto.name;
    }

    return this.communeRepo.save(commune);
  }

  // ─── DELETE ──────────────────────────────────────────────────────────────

  async remove(id: number): Promise<void> {
    const commune = await this.findOne(id);

    // Vérifier qu'aucun fokontany ne pointe encore sur cette commune
    const hasChildren = await this.communeRepo.manager
      .getRepository('fokontany')
      .count({ where: { communeId: id } });

    if (hasChildren > 0) {
      throw new BadRequestException(
        `Impossible de supprimer : ${hasChildren} fokontany(s) rattaché(s) à cette commune`,
      );
    }

    await this.communeRepo.remove(commune);
  }
}