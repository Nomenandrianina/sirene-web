import { Module } from '@nestjs/common';
import { DiffusionConfigService } from './diffusion-config.service';
import { DiffusionConfigController } from './diffusion-config.controller';
import { DiffusionConfig } from './entities/diffusion-config.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiffusionConfig]), 
  ],
  controllers: [DiffusionConfigController],
  providers: [DiffusionConfigService],
  exports:     [DiffusionConfigService],
})
export class DiffusionConfigModule {}
