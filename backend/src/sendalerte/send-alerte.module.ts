import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { SendAlerteService }    from "./send-alerte.service";
import { SendAlerteController } from "./send-alerte.controller";
import { Sirene }               from "@/sirene/entities/sirene.entity";
import { Village }              from "@/villages/entities/village.entity";
import { SousCategorieAlerte }  from "@/sous-categorie-alerte/entities/sous-categorie-alerte.entity";
import { AlerteAudio } from "@/alerte-audio/entities/alerte-audio.entity";
import { Notification }         from "@/notification/entities/notification.entity";
import { SmsModule }            from "../sms/sms.module";

@Module({
  imports: [
    ScheduleModule.forRoot(), // à mettre aussi dans AppModule si pas déjà fait
    TypeOrmModule.forFeature([Sirene, Village, SousCategorieAlerte, AlerteAudio, Notification]),
    SmsModule,
  ],
  controllers: [SendAlerteController],
  providers:   [SendAlerteService],
  exports:     [SendAlerteService],
})
export class SendAlerteModule {}