import { Injectable } from '@nestjs/common';
import { CreateTimeSettingDto } from './dto/create-time-setting.dto';
import { UpdateTimeSettingDto } from './dto/update-time-setting.dto';

@Injectable()
export class TimeSettingService {
  create(createTimeSettingDto: CreateTimeSettingDto) {
    return 'This action adds a new timeSetting';
  }

  findAll() {
    return `This action returns all timeSetting`;
  }

  findOne(id: number) {
    return `This action returns a #${id} timeSetting`;
  }

  update(id: number, updateTimeSettingDto: UpdateTimeSettingDto) {
    return `This action updates a #${id} timeSetting`;
  }

  remove(id: number) {
    return `This action removes a #${id} timeSetting`;
  }
}
