import {
  Controller, Get, Post, Patch, Delete, Param,
  Body, ParseIntPipe, Request,
} from '@nestjs/common';
import { SirenesService }   from './sirene.service';
import { CreateSireneDto }  from './dto/create-sirene.dto';
import { UpdateSireneDto }  from './dto/update-sirene.dto';
import { SmsService } from '@/services/sms.service';

class SendAlertDto {
  message: string;
}

@Controller('sirenes')
export class SirenesController {
  constructor(private readonly sirenesService: SirenesService,private readonly smsService: SmsService) {}

  @Get()
  findAll(@Request() req) {
    const user         = req.user;
    const isSuperAdmin = user.isSuperAdmin ?? user.role?.name === 'superadmin';
    const customerId   = user.customerId   ?? user.customer?.id;
    return this.sirenesService.findAll(isSuperAdmin, customerId);
  } 

  
  @Get('messageavailable')
  getmessageavalaible(@Request() req) {
    return this.smsService.getAdminContracts();
  }
  

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sirenesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSireneDto, @Request() req) {
    return this.sirenesService.create(dto, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSireneDto,
    @Request() req,
  ) {
    return this.sirenesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.sirenesService.remove(id, req.user.id);
  }


  /** POST /sirenes/:id/alert — déclencher une alerte SMS */
  // @Post(':id/alert')
  // sendAlert(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() dto: SendAlertDto,
  //   @Request() req,
  // ) {
  //   return this.sirenesService.sendAlert(id, dto.message, req.user.id);
  // }
}