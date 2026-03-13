import { Injectable } from '@nestjs/common';
import { CreateColorCodeDto } from './dto/create-color-code.dto';
import { UpdateColorCodeDto } from './dto/update-color-code.dto';

@Injectable()
export class ColorCodeService {
  create(createColorCodeDto: CreateColorCodeDto) {
    return 'This action adds a new colorCode';
  }

  findAll() {
    return `This action returns all colorCode`;
  }

  findOne(id: number) {
    return `This action returns a #${id} colorCode`;
  }

  update(id: number, updateColorCodeDto: UpdateColorCodeDto) {
    return `This action updates a #${id} colorCode`;
  }

  remove(id: number) {
    return `This action removes a #${id} colorCode`;
  }
}
