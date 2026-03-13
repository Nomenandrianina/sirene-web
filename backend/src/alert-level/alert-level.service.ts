import { Injectable } from '@nestjs/common';
import { CreateAlertLevelDto } from './dto/create-alert-level.dto';
import { UpdateAlertLevelDto } from './dto/update-alert-level.dto';

@Injectable()
export class AlertLevelService {
  create(createAlertLevelDto: CreateAlertLevelDto) {
    return 'This action adds a new alertLevel';
  }

  findAll() {
    return `This action returns all alertLevel`;
  }

  findOne(id: number) {
    return `This action returns a #${id} alertLevel`;
  }

  update(id: number, updateAlertLevelDto: UpdateAlertLevelDto) {
    return `This action updates a #${id} alertLevel`;
  }

  remove(id: number) {
    return `This action removes a #${id} alertLevel`;
  }
}
