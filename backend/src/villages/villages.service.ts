import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Village } from './entities/village.entity';
import { Province } from '../provinces/entities/province.entity';
import { Region } from '../regions/entities/region.entity';
import { District } from '../districts/entities/district.entity';
import { CreateVillageDto } from './dto/create-village.dto';
import { UpdateVillageDto } from './dto/update-village.dto';

@Injectable()
export class VillagesService {
  constructor(
    @InjectRepository(Village)
    private readonly villageRepository: Repository<Village>,

    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,

    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,

    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,
  ) {}

  async create(createVillageDto: CreateVillageDto): Promise<Village> {
    const province = await this.provinceRepository.findOne({
      where: { id: createVillageDto.provinceId },
    });
    if (!province) {
      throw new NotFoundException(`Province #${createVillageDto.provinceId} not found`);
    }

    const region = await this.regionRepository.findOne({
      where: { id: createVillageDto.regionId },
    });
    if (!region) {
      throw new NotFoundException(`Region #${createVillageDto.regionId} not found`);
    }

    const district = await this.districtRepository.findOne({
      where: { id: createVillageDto.districtId },
    });
    if (!district) {
      throw new NotFoundException(`District #${createVillageDto.districtId} not found`);
    }

    const village = this.villageRepository.create({
      name: createVillageDto.name,
      latitude: createVillageDto.latitude,
      longitude: createVillageDto.longitude,
      province,
      region,
      distict: district,
    });
    return await this.villageRepository.save(village);
  }

  async findAll(): Promise<Village[]> {
    return await this.villageRepository.find();
  }

  async findOne(id: number): Promise<Village> {
    const village = await this.villageRepository.findOne({ where: { id } });
    if (!village) {
      throw new NotFoundException(`Village #${id} not found`);
    }
    return village;
  }

  async update(id: number, updateVillageDto: UpdateVillageDto): Promise<Village> {
    const village = await this.findOne(id);

    if (updateVillageDto.name) {
      village.name = updateVillageDto.name;
    }

    if (updateVillageDto.latitude) {
      village.latitude = updateVillageDto.latitude;
    }

    if (updateVillageDto.longitude) {
      village.longitude = updateVillageDto.longitude;
    }

    if (updateVillageDto.provinceId) {
      const province = await this.provinceRepository.findOne({
        where: { id: updateVillageDto.provinceId },
      });
      if (!province) {
        throw new NotFoundException(`Province #${updateVillageDto.provinceId} not found`);
      }
      village.province = province;
    }

    if (updateVillageDto.regionId) {
      const region = await this.regionRepository.findOne({
        where: { id: updateVillageDto.regionId },
      });
      if (!region) {
        throw new NotFoundException(`Region #${updateVillageDto.regionId} not found`);
      }
      village.region = region;
    }

    if (updateVillageDto.districtId) {
      const district = await this.districtRepository.findOne({
        where: { id: updateVillageDto.districtId },
      });
      if (!district) {
        throw new NotFoundException(`District #${updateVillageDto.districtId} not found`);
      }
      village.distict = district;
    }

    return await this.villageRepository.save(village);
  }

  async remove(id: number): Promise<void> {
    const village = await this.findOne(id);
    await this.villageRepository.remove(village);
  }
}