import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AlertLevelService } from './alert-level.service';
import { CreateAlertLevelDto } from './dto/create-alert-level.dto';
import { UpdateAlertLevelDto } from './dto/update-alert-level.dto';

@Controller('alert-level')
export class AlertLevelController {
  constructor(private readonly alertLevelService: AlertLevelService) {}

  @Post()
  create(@Body() createAlertLevelDto: CreateAlertLevelDto) {
    return this.alertLevelService.create(createAlertLevelDto);
  }

  @Get()
  findAll() {
    return this.alertLevelService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alertLevelService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAlertLevelDto: UpdateAlertLevelDto) {
    return this.alertLevelService.update(+id, updateAlertLevelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.alertLevelService.remove(+id);
  }
}
