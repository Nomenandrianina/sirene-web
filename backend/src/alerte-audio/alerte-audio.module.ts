import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MulterModule } from "@nestjs/platform-express";
import { AlerteAudio } from "./entities/alerte-audio.entity";
import { AlerteAudioService } from "./alerte-audio.service";
import { AlerteAudioController } from "./alerte-audio.controller";
import { SousCategorieAlerte } from "@/sous-categorie-alerte/entities/sous-categorie-alerte.entity";
import { Sirene } from "@/sirene/entities/sirene.entity";
import { SirenesModule } from "@/sirene/sirene.module";
import { User } from "src/users/entities/user.entity";
import { NotificationswebModule } from "src/notificationsweb/notificationsweb.module";
import { Customer } from "src/customers/entity/customer.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([AlerteAudio,SousCategorieAlerte,Sirene,User,Customer]),
    MulterModule.register({ dest: "./uploads/audios" }),
    SirenesModule,
    NotificationswebModule
  ],
  controllers: [AlerteAudioController],
  providers: [AlerteAudioService],
  exports: [AlerteAudioService],
})
export class AlerteAudioModule {}