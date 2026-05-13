import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, ParseIntPipe, UseGuards, Patch,
} from '@nestjs/common';
import { TypeAlerteBngrcService }    from './type-alerte-bngrc.service';
import { CreateTypeAlerteBngrcDto, UpdateTypeAlerteBngrcDto,} from './dto/create-type-alerte-bngrc.dto';

@Controller('type-alerte-bngrc')
export class TypeAlerteBngrcController {
  constructor(private readonly service: TypeAlerteBngrcService) {}

  // GET /type-alerte-bngrc                    → tous
  // GET /type-alerte-bngrc?alerteBngrcId=2    → filtrés par alerte
  @Get()
  findAll(@Query('alerteBngrcId') alerteBngrcId?: string) {
    if (alerteBngrcId) return this.service.findByAlerte(+alerteBngrcId);
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTypeAlerteBngrcDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTypeAlerteBngrcDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
