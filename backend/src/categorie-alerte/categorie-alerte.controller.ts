import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from "@nestjs/common";
import { CategorieAlerteService } from "./categorie-alerte.service";
import { CreateCategorieAlerteDto } from "./dto/create-categorie-alerte.dto";
import { UpdateCategorieAlerteDto } from "./dto/update-categorie-alerte.dto";

@Controller("categorie-alertes")
export class CategorieAlerteController {
  constructor(private readonly service: CategorieAlerteService) {}

  @Get()
  findAll(@Query("alerteTypeId") alerteTypeId?: string) {
    return this.service.findAll(alerteTypeId ? +alerteTypeId : undefined);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  create(@Body() dto: CreateCategorieAlerteDto) { return this.service.create(dto); }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCategorieAlerteDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) { return this.service.remove(id); }
}