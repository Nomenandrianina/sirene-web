import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MulterModule } from "@nestjs/platform-express";
import { AlerteAudio } from "./entities/alerte-audio.entity";
import { AlerteAudioService } from "./alerte-audio.service";
import { AlerteAudioController } from "./alerte-audio.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([AlerteAudio]),
    MulterModule.register({ dest: "./uploads/audios" }),
  ],
  controllers: [AlerteAudioController],
  providers: [AlerteAudioService],
  exports: [AlerteAudioService],
})
export class AlerteAudioModule {}