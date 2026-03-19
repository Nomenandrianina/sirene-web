import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MulterModule } from "@nestjs/platform-express";
import { AlerteAudio } from "./entities/alerte-audio.entity";
import { AlerteAudioService } from "./alerte-audio.service";
import { AlerteAudioController } from "./alerte-audio.controller";
import { SousCategorieAlerte } from "@/sous-categorie-alerte/entities/sous-categorie-alerte.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([AlerteAudio,SousCategorieAlerte]),
    MulterModule.register({ dest: "./uploads/audios" }),
  ],
  controllers: [AlerteAudioController],
  providers: [AlerteAudioService],
  exports: [AlerteAudioService],
})
export class AlerteAudioModule {}