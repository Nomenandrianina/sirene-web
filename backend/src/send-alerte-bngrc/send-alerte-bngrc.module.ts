import { Module } from '@nestjs/common';
import { SendAlerteBngrcService } from './send-alerte-bngrc.service';
import { SendAlerteBngrcController } from './send-alerte-bngrc.controller';
import { SmsModule } from 'src/sms/sms.module';
import { User } from 'src/users/entities/user.entity';
import { CategorieAlerteBngrc } from 'src/categorie-alerte-bngrc/entities/categorie-alerte-bngrc.entity';
import { AudioAlerteBngrc } from 'src/audio-alerte-bngrc/entities/audio-alerte-bngrc.entity';
import { Village } from 'src/villages/entities/village.entity';
import { Sirene } from 'src/sirene/entities/sirene.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationBngrc } from 'src/notification-bngrc/entities/notification-bngrc.entity';
import { Notificationsweb } from 'src/notificationsweb/entities/notificationsweb.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sirene, Village, 
      AudioAlerteBngrc, CategorieAlerteBngrc, User,NotificationBngrc,Notificationsweb
    ]),
    SmsModule,
  ],
  controllers: [SendAlerteBngrcController],
  providers: [SendAlerteBngrcService],
})
export class SendAlerteBngrcModule {}
