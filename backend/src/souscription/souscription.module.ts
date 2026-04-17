import { Module } from '@nestjs/common';
import { SouscriptionService } from './souscription.service';
import { SouscriptionController } from './souscription.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Souscription } from './entities/souscription.entity';
import { PackType } from '@/packtype/entities/packtype.entity';
import { Notification } from '@/notification/entities/notification.entity';
import { AlerteAudio } from '@/alerte-audio/entities/alerte-audio.entity';
import { DiffusionPlanifieeModule } from 'src/diffusion-planifiee/diffusion-planifiee.module';

@Module({
  imports: [TypeOrmModule.forFeature([Souscription,PackType,Notification,AlerteAudio]),
  DiffusionPlanifieeModule, 
  ],
  controllers: [SouscriptionController],
  providers: [SouscriptionService],
  exports: [SouscriptionService],

})
export class SouscriptionModule {}
