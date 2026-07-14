import { Module, forwardRef } from '@nestjs/common';
import { SouscriptionService } from './souscription.service';
import { SouscriptionController } from './souscription.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Souscription } from './entities/souscription.entity';
import { PackType } from '@/packtype/entities/packtype.entity';
import { Notification } from '@/notification/entities/notification.entity';
import { AlerteAudio } from '@/alerte-audio/entities/alerte-audio.entity';
import { DiffusionPlanifieeModule } from 'src/diffusion-planifiee/diffusion-planifiee.module';
import { Notificationsweb } from 'src/notificationsweb/entities/notificationsweb.entity';
import { User } from 'src/users/entities/user.entity';
import { SouscriptionSirene } from 'src/souscription-sirene/entities/souscription-sirene.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Souscription,PackType,Notification,AlerteAudio,Notificationsweb,User,SouscriptionSirene]),
  forwardRef(() => DiffusionPlanifieeModule,), 
  ],
  controllers: [SouscriptionController],
  providers: [SouscriptionService],
  exports: [SouscriptionService],

})
export class SouscriptionModule {}
