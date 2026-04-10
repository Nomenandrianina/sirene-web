import { Injectable } from '@nestjs/common';
import { CreateDiffusionLogDto } from './dto/create-diffusion-log.dto';
import { UpdateDiffusionLogDto } from './dto/update-diffusion-log.dto';

@Injectable()
export class DiffusionLogService {
  create(createDiffusionLogDto: CreateDiffusionLogDto) {
    return 'This action adds a new diffusionLog';
  }

  findAll() {
    return `This action returns all diffusionLog`;
  }

  findOne(id: number) {
    return `This action returns a #${id} diffusionLog`;
  }

  update(id: number, updateDiffusionLogDto: UpdateDiffusionLogDto) {
    return `This action updates a #${id} diffusionLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} diffusionLog`;
  }
}
