import { Module } from '@nestjs/common';
import { AudioAlerteBngrcService } from './audio-alerte-bngrc.service';
import { AudioAlerteBngrcController } from './audio-alerte-bngrc.controller';
import { AudioAlerteBngrc } from './entities/audio-alerte-bngrc.entity';
import { Sirene } from 'src/sirene/entities/sirene.entity';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategorieAlerteBngrc } from 'src/categorie-alerte-bngrc/entities/categorie-alerte-bngrc.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AudioAlerteBngrc, Sirene,CategorieAlerteBngrc]),
    MulterModule.register({ dest: './uploads/audios-bngrc' }),
  ],
  providers:   [AudioAlerteBngrcService],
  controllers: [AudioAlerteBngrcController],
  exports:     [AudioAlerteBngrcService],
})
export class AudioAlerteBngrcModule {}
