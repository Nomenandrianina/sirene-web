import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';
import { AlerteBngrc }      from './entities/alerte-bngrc.entity';
import {  CreateAlerteBngrcDto,UpdateAlerteBngrcDto, } from './dto/create-alerte-bngrc.dto';

@Injectable()
export class AlerteBngrcService {
  constructor(
    @InjectRepository(AlerteBngrc)
    private readonly repo: Repository<AlerteBngrc>,
  ) {}

  async findAll(): Promise<AlerteBngrc[]> {
    return this.repo.find({
      relations: ['types', 'types.categories'],
      order:     { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<AlerteBngrc> {
    const alerte = await this.repo.findOne({
      where:     { id },
      relations: ['types', 'types.categories', 'types.categories.audios'],
    });
    if (!alerte) throw new NotFoundException(`AlerteBngrc #${id} introuvable`);
    return alerte;
  }

  async create(dto: CreateAlerteBngrcDto): Promise<AlerteBngrc> {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Une AlerteBngrc avec le nom "${dto.name}" existe déjà`);

    const alerte = this.repo.create(dto);
    return this.repo.save(alerte);
  }

  async update(id: number, dto: UpdateAlerteBngrcDto): Promise<AlerteBngrc> {
    const alerte = await this.findOne(id);

    if (dto.name && dto.name !== alerte.name) {
      const existing = await this.repo.findOne({ where: { name: dto.name } });
      if (existing) throw new ConflictException(`Une AlerteBngrc avec le nom "${dto.name}" existe déjà`);
    }

    Object.assign(alerte, dto);
    return this.repo.save(alerte);
  }

  async remove(id: number): Promise<{ message: string }> {
    const alerte = await this.findOne(id);
    await this.repo.softRemove(alerte);
    return { message: `AlerteBngrc #${id} supprimée` };
  }
}
