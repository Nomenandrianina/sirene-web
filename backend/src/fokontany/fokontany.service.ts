import {Injectable,NotFoundException,BadRequestException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fokontany } from './entities/fokontany.entity';
import { CreateFokontanyDto } from './dto/create-fokontany.dto';
import { UpdateFokontanyDto } from './dto/update-fokontany.dto';
import { Commune } from '@/commune/entities/commune.entity';

@Injectable()
export class FokontanyService {
  constructor(
    @InjectRepository(Fokontany)
    private readonly fokontanyRepo: Repository<Fokontany>,

    @InjectRepository(Commune)
    private readonly communeRepo: Repository<Commune>,
  ) {}

  // ─── CREATE ──────────────────────────────────────────────────────────────

  async create(dto: CreateFokontanyDto): Promise<Fokontany> {
    const commune = await this.communeRepo.findOne({
      where: { id: dto.communeId },
    });
    if (!commune) {
      throw new NotFoundException(`Commune #${dto.communeId} introuvable`);
    }

    const fokontany = this.fokontanyRepo.create({
      name: dto.name,
      communeId: dto.communeId,
    });
    return this.fokontanyRepo.save(fokontany);
  }

  // ─── READ ALL ─────────────────────────────────────────────────────────────

  async findAll(): Promise<Fokontany[]> {
    return this.fokontanyRepo.find({
      order: { name: 'ASC' },
    });
  }

  // ─── READ BY COMMUNE ──────────────────────────────────────────────────────

  async findByCommune(communeId: number): Promise<Fokontany[]> {
    return this.fokontanyRepo.find({
      where: { communeId },
      order: { name: 'ASC' },
    });
  }

  // ─── READ ONE ─────────────────────────────────────────────────────────────

  async findOne(id: number): Promise<Fokontany> {
    const fokontany = await this.fokontanyRepo.findOne({ where: { id } });
    if (!fokontany) {
      throw new NotFoundException(`Fokontany #${id} introuvable`);
    }
    return fokontany;
  }

  // ─── UPDATE ──────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateFokontanyDto): Promise<Fokontany> {
    const fokontany = await this.findOne(id);

    if (dto.communeId !== undefined) {
      const commune = await this.communeRepo.findOne({
        where: { id: dto.communeId },
      });
      if (!commune) {
        throw new NotFoundException(`Commune #${dto.communeId} introuvable`);
      }
      fokontany.communeId = dto.communeId;
    }

    if (dto.name !== undefined) {
      fokontany.name = dto.name;
    }

    return this.fokontanyRepo.save(fokontany);
  }

  // ─── DELETE ──────────────────────────────────────────────────────────────

  async remove(id: number): Promise<void> {
    const fokontany = await this.findOne(id);

    // Vérifier qu'aucun village ne pointe encore sur ce fokontany
    const hasChildren = await this.fokontanyRepo.manager
      .getRepository('villages')
      .count({ where: { fokontanyId: id } });

    if (hasChildren > 0) {
      throw new BadRequestException(
        `Impossible de supprimer : ${hasChildren} village(s) rattaché(s) à ce fokontany`,
      );
    }
    
    await this.fokontanyRepo.remove(fokontany);
  }
}