import { Injectable } from '@nestjs/common';
import { CreateDiffusionConfigDto } from './dto/create-diffusion-config.dto';
import { UpdateDiffusionConfigDto } from './dto/update-diffusion-config.dto';
import { DiffusionConfig } from './entities/diffusion-config.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpsertDiffusionConfigDto } from './dto/upsert-diffusion-config.dto';
import { Repository ,IsNull } from 'typeorm';


@Injectable()
export class DiffusionConfigService {

  private reloadCronsCallback?: () => Promise<void>;


  constructor(
    @InjectRepository(DiffusionConfig)
    private readonly repo: Repository<DiffusionConfig>,
  ) {}

    /** Appelé par DiffusionSchedulerService dans onModuleInit */
    setReloadCallback(fn: () => Promise<void>) {
      this.reloadCronsCallback = fn;
    }
  

  findAllActive(): Promise<DiffusionConfig[]> {
    return this.repo.find({ where: { isActive: true } });
  }

   async upsert(dto: UpsertDiffusionConfigDto): Promise<DiffusionConfig> {
    const existing = await this.repo.findOne({
      where: dto.regionId != null
        ? { regionId: dto.regionId }
        : { regionId: IsNull() },
    });
    const saved = await this.repo.save({ ...existing, ...dto });
    // recharge les crons après sauvegarde
    await this.reloadCronsCallback?.();
    return saved;
  }

  create(createDiffusionConfigDto: CreateDiffusionConfigDto) {
    return 'This action adds a new diffusionConfig';
  }

  findAll() {
    return `This action returns all diffusionConfig`;
  }

  findOne(id: number) {
    return `This action returns a #${id} diffusionConfig`;
  }

  update(id: number, updateDiffusionConfigDto: UpdateDiffusionConfigDto) {
    return `This action updates a #${id} diffusionConfig`;
  }


  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
    await this.reloadCronsCallback?.();
  }
}
