import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DiffusionSchedulerService } from './diffusion-scheduler.service';

import { Notification } from '@/notification/entities/notification.entity';
import { AlerteAudio } from '@/alerte-audio/entities/alerte-audio.entity';
import { Souscription } from '@/souscription/entities/souscription.entity';

import { SouscriptionModule } from '@/souscription/souscription.module';
import { SmsModule } from '@/sms/sms.module';
import { DiffusionPlanifieeModule } from 'src/diffusion-planifiee/diffusion-planifiee.module';
import { Sirene } from 'src/sirene/entities/sirene.entity';
import { DiffusionConfig } from 'src/diffusion-config/entities/diffusion-config.entity';
import { DiffusionConfigModule } from 'src/diffusion-config/diffusion-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      AlerteAudio,
      Souscription,
      Sirene,
      DiffusionConfig
    ]),
    SouscriptionModule,
    SmsModule,
    DiffusionPlanifieeModule,
    DiffusionConfigModule
  ],
  providers: [DiffusionSchedulerService],
  exports: [DiffusionSchedulerService],
})
export class DiffusionSchedulerModule {}