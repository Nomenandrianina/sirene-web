import { Injectable, NotFoundException, ConflictException, } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';
import { TypeAlerteBngrc }  from './entities/type-alerte-bngrc.entity';
import { CreateTypeAlerteBngrcDto,UpdateTypeAlerteBngrcDto,} from './dto/create-type-alerte-bngrc.dto';

@Injectable()
export class TypeAlerteBngrcService {
  constructor(
    @InjectRepository(TypeAlerteBngrc)
      private readonly repo: Repository<TypeAlerteBngrc>, 
  ) {}

  async findAll(): Promise<TypeAlerteBngrc[]> {
    return this.repo.find({
      relations: ['alerte', 'categories'],
      order:     { id: 'ASC' },
    });
  }

  // Récupérer tous les types d'une alerte donnée
  async findByAlerte(alerteBngrcId: number): Promise<TypeAlerteBngrc[]> {
    return this.repo.find({
      where:     { alerteBngrcId },
      relations: ['categories', 'categories.audios'],
      order:     { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<TypeAlerteBngrc> {
    const type = await this.repo.findOne({
      where:     { id },
      relations: ['alerte', 'categories', 'categories.audios'],
    });
    if (!type) throw new NotFoundException(`TypeAlerteBngrc #${id} introuvable`);
    return type;
  }

  async create(dto: CreateTypeAlerteBngrcDto): Promise<TypeAlerteBngrc> {
    // Unicité name + alerteBngrcId
    const existing = await this.repo.findOne({
      where: { name: dto.name, alerteBngrcId: dto.alerteBngrcId },
    });
    if (existing) {
      throw new ConflictException(
        `Un TypeAlerteBngrc "${dto.name}" existe déjà pour cette alerte`,
      );
    }
    const type = this.repo.create(dto);
    return this.repo.save(type);
  }

  async update(id: number, dto: UpdateTypeAlerteBngrcDto): Promise<TypeAlerteBngrc> {
    const type = await this.findOne(id);

    if (dto.name && dto.name !== type.name) {
      const alerteBngrcId = dto.alerteBngrcId ?? type.alerteBngrcId;
      const existing = await this.repo.findOne({
        where: { name: dto.name, alerteBngrcId },
      });
      if (existing) {
        throw new ConflictException(
          `Un TypeAlerteBngrc "${dto.name}" existe déjà pour cette alerte`,
        );
      }
    }

    Object.assign(type, dto);
    return this.repo.save(type);
  }

  async remove(id: number): Promise<{ message: string }> {
    const type = await this.findOne(id);
    await this.repo.softRemove(type);
    return { message: `TypeAlerteBngrc #${id} supprimé` };
  }
}
