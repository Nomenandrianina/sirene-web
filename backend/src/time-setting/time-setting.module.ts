import { Module } from '@nestjs/common';
import { TimeSettingService } from './time-setting.service';
import { TimeSettingController } from './time-setting.controller';

@Module({
  controllers: [TimeSettingController],
  providers: [TimeSettingService],
})
export class TimeSettingModule {}
