import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe } from "@nestjs/common";
import { AlerteTypeService } from "./alerte-type.service";
import { CreateAlerteTypeDto } from "./dto/create-alerte-type.dto";
import { UpdateAlerteTypeDto } from "./dto/update-alerte-type.dto";

@Controller("alerte-types")
export class AlerteTypeController {
  constructor(private readonly service: AlerteTypeService) {}

  @Get()
  findAll(@Query("alerteId") alerteId?: string) {
    return this.service.findAll(alerteId ? +alerteId : undefined);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  create(@Body() dto: CreateAlerteTypeDto) { return this.service.create(dto); }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateAlerteTypeDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) { return this.service.remove(id); }
}