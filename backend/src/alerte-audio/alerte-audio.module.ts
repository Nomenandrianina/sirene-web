import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MulterModule } from "@nestjs/platform-express";
import { AlerteAudio } from "./entities/alerte-audio.entity";
import { AlerteAudioService } from "./alerte-audio.service";
import { AlerteAudioController } from "./alerte-audio.controller";
import { SousCategorieAlerte } from "@/sous-categorie-alerte/entities/sous-categorie-alerte.entity";
import { Sirene } from "@/sirene/entities/sirene.entity";
import { SirenesModule } from "@/sirene/sirene.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([AlerteAudio,SousCategorieAlerte,Sirene]),
    MulterModule.register({ dest: "./uploads/audios" }),
    SirenesModule
  ],
  controllers: [AlerteAudioController],
  providers: [AlerteAudioService],
  exports: [AlerteAudioService],
})
export class AlerteAudioModule {}