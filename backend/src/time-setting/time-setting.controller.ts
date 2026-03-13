import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TimeSettingService } from './time-setting.service';
import { CreateTimeSettingDto } from './dto/create-time-setting.dto';
import { UpdateTimeSettingDto } from './dto/update-time-setting.dto';

@Controller('time-setting')
export class TimeSettingController {
  constructor(private readonly timeSettingService: TimeSettingService) {}

  @Post()
  create(@Body() createTimeSettingDto: CreateTimeSettingDto) {
    return this.timeSettingService.create(createTimeSettingDto);
  }

  @Get()
  findAll() {
    return this.timeSettingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.timeSettingService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTimeSettingDto: UpdateTimeSettingDto) {
    return this.timeSettingService.update(+id, updateTimeSettingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.timeSettingService.remove(+id);
  }
}
