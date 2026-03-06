import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { District } from './entities/district.entity';
import { Region } from '../regions/entities/region.entity';
import { CreateDistrictDto } from './dto/create-district.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';

@Injectable()
export class DistrictsService {
  constructor(
    @InjectRepository(District)
    private readonly districtRepository: Repository<District>,

    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,
  ) {}

  async create(createDistrictDto: CreateDistrictDto): Promise<District> {
    const region = await this.regionRepository.findOne({
      where: { id: createDistrictDto.regionId },
    });
    if (!region) {
      throw new NotFoundException(`Region #${createDistrictDto.regionId} not found`);
    }

    const district = this.districtRepository.create({
      name: createDistrictDto.name,
      region,
    });
    return await this.districtRepository.save(district);
  }

  async findAll(): Promise<District[]> {
    return await this.districtRepository.find();
  }

  async findOne(id: number): Promise<District> {
    const district = await this.districtRepository.findOne({ where: { id } });
    if (!district) {
      throw new NotFoundException(`District #${id} not found`);
    }
    return district;
  }

  async update(id: number, updateDistrictDto: UpdateDistrictDto): Promise<District> {
    const district = await this.findOne(id);

    if (updateDistrictDto.regionId) {
      const region = await this.regionRepository.findOne({
        where: { id: updateDistrictDto.regionId },
      });
      if (!region) {
        throw new NotFoundException(`Region #${updateDistrictDto.regionId} not found`);
      }
      district.region = region;
    }

    if (updateDistrictDto.name) {
      district.name = updateDistrictDto.name;
    }

    return await this.districtRepository.save(district);
  }

  async remove(id: number): Promise<void> {
    const district = await this.findOne(id);
    await this.districtRepository.remove(district);
  }
}