import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { SmsService } from '../services/sms.service';

class SendSmsDto {
  phoneNumber: string;
  message:     string;
}

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  /** POST /sms/send */
  @Post('send')
  send(@Body() dto: SendSmsDto) {
    return this.smsService.sendSms(dto.phoneNumber, dto.message);
  }

  /** GET /sms/contracts */
  @Get('contracts')
  contracts() {
    return this.smsService.getAdminContracts();
  }
}