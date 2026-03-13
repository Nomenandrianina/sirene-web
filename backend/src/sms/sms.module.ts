import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmsService }    from '../services/sms.service';
import { SmsController } from './sms.controller';

@Module({
  imports:     [ConfigModule],
  controllers: [SmsController],
  providers:   [SmsService],
  exports:     [SmsService],   // pour injection dans d'autres modules
})
export class SmsModule {}