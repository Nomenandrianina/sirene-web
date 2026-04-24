import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PackType } from './entities/packtype.entity';
import { CreatePackTypeDto, UpdatePackTypeDto } from './dto/create-packtype.dto';

@Injectable()
export class PacktypeService {
  constructor(
    @InjectRepository(PackType)
    private readonly repo: Repository<PackType>,
  ) {}

  async create(dto: CreatePackTypeDto): Promise<PackType> {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException(`Un pack nommé "${dto.name}" existe déjà`);
    }
    const pack = this.repo.create(dto);
    return this.repo.save(pack);
  }

  async findAll(onlyActive = false): Promise<PackType[]> {
    const where = onlyActive ? { isActive: true } : {};
    return this.repo.find({
      where,
      order: { prix: 'ASC' },
    });
  }

  async findOne(id: number): Promise<PackType> {
    const pack = await this.repo.findOne({ where: { id } });
    if (!pack) throw new NotFoundException(`PackType #${id} introuvable`);
    return pack;
  }

  async update(id: number, dto: UpdatePackTypeDto): Promise<PackType> {
    const pack = await this.findOne(id);

    // Vérifier unicité du nom si changé
    if (dto.name && dto.name !== pack.name) {
      const existing = await this.repo.findOne({ where: { name: dto.name } });
      if (existing) {
        throw new ConflictException(`Un pack nommé "${dto.name}" existe déjà`);
      }
    }

    Object.assign(pack, dto);
    return this.repo.save(pack);
  }

  async remove(id: number): Promise<void> {
    const pack = await this.findOne(id);
    // Soft delete : on désactive plutôt que supprimer
    pack.isActive = false;
    await this.repo.save(pack);
  }

  async hardDelete(id: number): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }

  /**
   * Seed initial des 3 packs de base
   * À appeler depuis un seeder ou OnModuleInit
   */
  async seedPacks(): Promise<void> {
    // const packs: CreatePackTypeDto[] = [
    //   {
    //     name: 'premium',
    //     description: '3 diffusions par jour, tous les jours (semaine + mensuel)',
    //     frequenceParJour: 3,
    //     joursParSemaine: 7,
    //     joursAutorises: null,
    //     dureeMaxMinutes: 20,
    //     prix: 150000,
    //     periode: 'monthly' as any,
    //     isActive: true,
    //   },
    //   {
    //     name: 'medium',
    //     description: '1 diffusion par jour, tous les jours (semaine + mensuel)',
    //     frequenceParJour: 1,
    //     joursParSemaine: 7,
    //     joursAutorises : null,
    //     dureeMaxMinutes: 20,
    //     prix: 75000,
    //     periode: 'monthly' as any,
    //     isActive: true,
    //   },
    //   {
    //     name: 'basique',
    //     description: '3 diffusions par semaine (lundi, mercredi, vendredi)',
    //     frequenceParJour: 1,
    //     joursParSemaine: 3,
    //     joursAutorises: [1, 3, 5], // lundi, mercredi, vendredi
    //     dureeMaxMinutes: 15,
    //     prix: 30000,
    //     periode: 'monthly' as any,
    //     isActive: true,
    //   },
    // ];

    // for (const p of packs) {
    //   const exists = await this.repo.findOne({ where: { name: p.name } });
    //   if (!exists) {
    //     await this.repo.save(this.repo.create(p));
    //     console.log(`[Seed] Pack "${p.name}" créé`);
    //   }
    // }
  }
}