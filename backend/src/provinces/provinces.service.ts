import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProvinceDto } from './dto/create-province.dto';
import { UpdateProvinceDto } from './dto/update-province.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Province } from './entities/province.entity';
import { Repository } from 'typeorm';


@Injectable()
export class ProvincesService {
  constructor(
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
  ) {}

  async create(createProvinceDto: CreateProvinceDto): Promise<Province> {
    const province = this.provinceRepository.create(createProvinceDto);
    return await this.provinceRepository.save(province);
  }

  async findAll(): Promise<Province[]> {
    return await this.provinceRepository.find();
  }

  async findOne(id: number): Promise<Province> {
    const province = await this.provinceRepository.findOne({ where: { id } });
    if (!province) {
      throw new NotFoundException(`Province #${id} not found`);
    }
    return province;
  }

  async update(id: number, updateProvinceDto: UpdateProvinceDto): Promise<Province> {
    const province = await this.findOne(id);
    Object.assign(province, updateProvinceDto);
    return await this.provinceRepository.save(province);
  }

  async remove(id: number): Promise<void> {
    const province = await this.findOne(id);
    await this.provinceRepository.remove(province);
  }
}