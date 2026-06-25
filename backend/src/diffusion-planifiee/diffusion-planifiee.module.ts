import { Module } from '@nestjs/common';
import { DiffusionPlanifieeService } from './diffusion-planifiee.service';
import { DiffusionPlanifieeController } from './diffusion-planifiee.controller';
import { DiffusionPlanifiee } from './entities/diffusion-planifiee.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Souscription } from 'src/souscription/entities/souscription.entity';
import { DiffusionConfig } from 'src/diffusion-config/entities/diffusion-config.entity';
import { AlerteAudio } from 'src/alerte-audio/entities/alerte-audio.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiffusionPlanifiee,DiffusionConfig,AlerteAudio]),
    
  ],
  controllers: [DiffusionPlanifieeController],
  providers: [DiffusionPlanifieeService],
  exports: [DiffusionPlanifieeService],

})
export class DiffusionPlanifieeModule {}
