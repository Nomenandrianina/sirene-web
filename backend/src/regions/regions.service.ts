import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region } from './entities/region.entity';
import { Province } from '../provinces/entities/province.entity';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,

    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
  ) {}

  async create(createRegionDto: CreateRegionDto): Promise<Region> {
    const province = await this.provinceRepository.findOne({
      where: { id: createRegionDto.provinceId },
    });
    if (!province) {
      throw new NotFoundException(`Province #${createRegionDto.provinceId} not found`);
    }

    const region = this.regionRepository.create({
      name: createRegionDto.name,
      province,
    });
    return await this.regionRepository.save(region);
  }

  async findAll(): Promise<Region[]> {
    return await this.regionRepository.find();
  }

  async findOne(id: number): Promise<Region> {
    const region = await this.regionRepository.findOne({ where: { id } });
    if (!region) {
      throw new NotFoundException(`Region #${id} not found`);
    }
    return region;
  }

  async update(id: number, updateRegionDto: UpdateRegionDto): Promise<Region> {
    const region = await this.findOne(id);

    if (updateRegionDto.provinceId) {
      const province = await this.provinceRepository.findOne({
        where: { id: updateRegionDto.provinceId },
      });
      if (!province) {
        throw new NotFoundException(`Province #${updateRegionDto.provinceId} not found`);
      }
      region.province = province;
    }

    if (updateRegionDto.name) {
      region.name = updateRegionDto.name;
    }

    return await this.regionRepository.save(region);
  }

  async remove(id: number): Promise<void> {
    const region = await this.findOne(id);
    await this.regionRepository.remove(region);
  }
}