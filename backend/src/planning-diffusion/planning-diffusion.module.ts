import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

// ⚠️ Adaptez les imports à votre structure
import { Notification } from '@/notification/entities/notification.entity';
import { AlerteAudio }  from '@/alerte-audio/entities/alerte-audio.entity';
import { Souscription } from '@/souscription/entities/souscription.entity';

import { DiffusionSchedulerService }  from '@/diffusion-scheduler/diffusion-scheduler.service';
import { PlanningDiffusionService }   from '@/planning-diffusion/planning-diffusion.service';
import { PlanningDiffusionController } from '@/planning-diffusion/planning-diffusion.controller';
import { SouscriptionService }        from '@/souscription/souscription.service';
import { PackType }                   from '@/packtype/entities/packtype.entity';
import { SmsModule } from '@/sms/sms.module';
import { SouscriptionModule } from '@/souscription/souscription.module';
import { PlanningDiffusion } from './entities/planning-diffusion.entity';
import { DiffusionPlanifieeModule } from 'src/diffusion-planifiee/diffusion-planifiee.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, AlerteAudio, Souscription, PackType,PlanningDiffusion]),
    ScheduleModule.forRoot(),
    SmsModule,
    SouscriptionModule,
    DiffusionPlanifieeModule
  ],
  controllers: [PlanningDiffusionController],
  providers: [
    DiffusionSchedulerService,
    PlanningDiffusionService,
  ],
})
export class PlanningDiffusionModule {}