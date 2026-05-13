import { Injectable, NotFoundException, ConflictException,} from '@nestjs/common';
import { InjectRepository }     from '@nestjs/typeorm';
import { Repository }           from 'typeorm';
import { CategorieAlerteBngrc } from './entities/categorie-alerte-bngrc.entity';
import { CreateCategorieAlerteBngrcDto, UpdateCategorieAlerteBngrcDto, } from './dto/create-categorie-alerte-bngrc.dto';

@Injectable()
export class CategorieAlerteBngrcService {
  constructor(
    @InjectRepository(CategorieAlerteBngrc)
    private readonly repo: Repository<CategorieAlerteBngrc>,
  ) {}

  async findAll(): Promise<CategorieAlerteBngrc[]> {
    return this.repo.find({
      relations: ['type', 'audios'],
      order:     { id: 'ASC' },
    });
  }

  // Filtre par type (aléa)
  async findByType(typeAlerteBngrcId: number): Promise<CategorieAlerteBngrc[]> {
    return this.repo.find({
      where:     { typeAlerteBngrcId },
      relations: ['audios', 'audios.sirenes'],
      order:     { id: 'ASC' },
    });
  }

  // Filtre par alerte parente (dénormalisé)
  async findByAlerte(alerteBngrcId: number): Promise<CategorieAlerteBngrc[]> {
    return this.repo.find({
      where:     { alerteBngrcId },
      relations: ['type', 'audios'],
      order:     { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<CategorieAlerteBngrc> {
    const cat = await this.repo.findOne({
      where:     { id },
      relations: ['type', 'audios', 'audios.sirenes'],
    });
    if (!cat) throw new NotFoundException(`CategorieAlerteBngrc #${id} introuvable`);
    return cat;
  }

  async create(dto: CreateCategorieAlerteBngrcDto): Promise<CategorieAlerteBngrc> {
    const existing = await this.repo.findOne({
      where: { name: dto.name, typeAlerteBngrcId: dto.typeAlerteBngrcId },
    });
    if (existing) {
      throw new ConflictException(
        `Une CategorieAlerteBngrc "${dto.name}" existe déjà pour ce type`,
      );
    }
    const cat = this.repo.create(dto);
    return this.repo.save(cat);
  }

  async update(
    id: number,
    dto: UpdateCategorieAlerteBngrcDto,
  ): Promise<CategorieAlerteBngrc> {
    const cat = await this.findOne(id);

    if (dto.name && dto.name !== cat.name) {
      const typeId = dto.typeAlerteBngrcId ?? cat.typeAlerteBngrcId;
      const existing = await this.repo.findOne({
        where: { name: dto.name, typeAlerteBngrcId: typeId },
      });
      if (existing) {
        throw new ConflictException(
          `Une CategorieAlerteBngrc "${dto.name}" existe déjà pour ce type`,
        );
      }
    }

    Object.assign(cat, dto);
    return this.repo.save(cat);
  }

  async remove(id: number): Promise<{ message: string }> {
    const cat = await this.findOne(id);
    await this.repo.softRemove(cat);
    return { message: `CategorieAlerteBngrc #${id} supprimée` };
  }
}
