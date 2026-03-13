import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Flow } from 'src/flows/entities/flow.entity';
import { Village } from 'src/villages/entities/village.entity'; 
import { Weather } from 'src/weathers/entities/weather.entity'; 
import { WeathersService } from 'src/weathers/weathers.service';
import { WeathersController } from 'src/weathers/weathers.controller';
import { VillagesModule } from 'src/villages/villages.module';
import { FlowsModule } from 'src/flows/flows.module';
import { WindguruService } from 'src/services/windguru.service';
import { TimeSetting } from 'src/time-setting/entities/time-setting.entity';
import { AlertLevel } from 'src/alert-level/entities/alert-level.entity';
import { ColorCode } from 'src/color-code/entities/color-code.entity';
import { Setting } from 'src/settings/entities/setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ Flow,
    Weather,
    Village,
    ColorCode,
    AlertLevel,
    TimeSetting,
    Setting,]),VillagesModule,FlowsModule],
  controllers: [WeathersController],
  providers: [WeathersService,WindguruService],
  exports: [WeathersService,WindguruService,TypeOrmModule],
})
export class WeathersModule {}