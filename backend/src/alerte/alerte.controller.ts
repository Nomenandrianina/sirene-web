import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, Req } from "@nestjs/common";
import { AlerteService } from "./alerte.service";
import { CreateAlerteDto } from "./dto/create-alerte.dto";
import { UpdateAlerteDto } from "./dto/update-alerte.dto";

@Controller("alertes")
export class AlerteController {
  constructor(private readonly service: AlerteService) {}

  @Get()
  findAll(@Req() req: any) {
    const user          = req.user;
    const isSuperAdmin  = user?.isSuperAdmin ?? true;
    const customerId    = user?.customer?.id;
    return this.service.findAll(isSuperAdmin, customerId);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  create(@Body() dto: CreateAlerteDto) { return this.service.create(dto); }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateAlerteDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) { return this.service.remove(id); }
}