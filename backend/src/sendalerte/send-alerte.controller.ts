import { Controller, Post, Body, Get, Query } from "@nestjs/common";
import { SendAlerteService } from "@/sendalerte/send-alerte.service";
import { SendAlerteDto }     from "./dto/send-alerte.dto";

@Controller("send-alerte")
export class SendAlerteController {
  constructor(private readonly service: SendAlerteService) {}

  @Post()
  send(@Body() dto: SendAlerteDto) {
    return this.service.sendAlerte(dto);
  }

  // Aperçu : combien de sirènes seront touchées selon les zones
  @Get("preview")
  preview(
    @Query("provinceIds")  provinceIds?:  string,
    @Query("regionIds")    regionIds?:    string,
    @Query("districtIds")  districtIds?:  string,
  ) {
    return this.service.preview({
      provinceIds:  provinceIds  ? provinceIds.split(",").map(Number)  : [],
      regionIds:    regionIds    ? regionIds.split(",").map(Number)    : [],
      districtIds:  districtIds  ? districtIds.split(",").map(Number)  : [],
    });
  }
}