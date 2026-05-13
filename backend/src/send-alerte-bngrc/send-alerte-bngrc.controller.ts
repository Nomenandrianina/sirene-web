import { Controller, Get, Post, Body, Patch, Param, Delete, Request, Query } from '@nestjs/common';
import { SendAlerteBngrcService } from './send-alerte-bngrc.service';
import { CreateSendAlerteBngrcDto } from './dto/create-send-alerte-bngrc.dto';
import { UpdateSendAlerteBngrcDto } from './dto/update-send-alerte-bngrc.dto';
import { SendAlerteBngrcDto } from './dto/send-alerte-bngrc.dto';

@Controller('send-alerte-bngrc')
export class SendAlerteBngrcController {
  constructor(private readonly service: SendAlerteBngrcService) {}

  @Post()
  send(@Body() dto: SendAlerteBngrcDto, @Request() req: any) {
    dto.userId = req.user?.sub ?? req.user?.id;
    return this.service.sendAlerteBngrc(dto);
  }

  // Prévisualisation des sirènes touchées — même interface que /send-alerte/preview
  @Get('preview')
  preview(
    @Query('provinceIds')  provinceIds?:  string,
    @Query('regionIds')    regionIds?:    string,
    @Query('districtIds')  districtIds?:  string,
    @Query('villageIds')   villageIds?:   string,
  ) {
    return this.service.preview({
      provinceIds:  provinceIds  ? provinceIds.split(',').map(Number)  : [],
      regionIds:    regionIds    ? regionIds.split(',').map(Number)    : [],
      districtIds:  districtIds  ? districtIds.split(',').map(Number)  : [],
      villageIds:   villageIds   ? villageIds.split(',').map(Number)   : [],
    });
  }
}
