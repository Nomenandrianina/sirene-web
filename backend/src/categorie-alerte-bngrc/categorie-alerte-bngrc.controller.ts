import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe, UseGuards, Patch, } from '@nestjs/common';
import { CategorieAlerteBngrcService }    from './categorie-alerte-bngrc.service';
import { CreateCategorieAlerteBngrcDto, UpdateCategorieAlerteBngrcDto, } from './dto/create-categorie-alerte-bngrc.dto';

@Controller('categorie-alerte-bngrc')
export class CategorieAlerteBngrcController {
  constructor(private readonly service: CategorieAlerteBngrcService) {}

  @Get()
  findAll(
    @Query('typeAlerteBngrcId') typeId?: string,
    @Query('alerteBngrcId')     alerteId?: string,
  ) {
    if (typeId)    return this.service.findByType(+typeId);
    if (alerteId)  return this.service.findByAlerte(+alerteId);
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCategorieAlerteBngrcDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategorieAlerteBngrcDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
