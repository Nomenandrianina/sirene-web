import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from "@nestjs/common";
import { SousCategorieAlerteService } from "./sous-categorie-alerte.service";
import { CreateSousCategorieAlerteDto } from "./dto/create-sous-categorie-alerte.dto";
import { UpdateSousCategorieAlerteDto } from "./dto/update-sous-categorie-alerte.dto";

@Controller("sous-categorie-alertes")
export class SousCategorieAlerteController {
  constructor(private readonly service: SousCategorieAlerteService) {}

  @Get()
  findAll(@Query("categorieAlerteId") categorieAlerteId?: string) {
    return this.service.findAll(categorieAlerteId ? +categorieAlerteId : undefined);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  create(@Body() dto: CreateSousCategorieAlerteDto) { return this.service.create(dto); }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateSousCategorieAlerteDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) { return this.service.remove(id); }
}