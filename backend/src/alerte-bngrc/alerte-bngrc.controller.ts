import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, UseGuards, Patch, } from '@nestjs/common';
import { AlerteBngrcService }        from './alerte-bngrc.service';
import { CreateAlerteBngrcDto, UpdateAlerteBngrcDto } from './dto/create-alerte-bngrc.dto';

@Controller('alerte-bngrc')
export class AlerteBngrcController {
  constructor(private readonly service: AlerteBngrcService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAlerteBngrcDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAlerteBngrcDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
