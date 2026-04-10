import { Module } from '@nestjs/common';
import { DiffusionLogService } from './diffusion-log.service';
import { DiffusionLogController } from './diffusion-log.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiffusionLog } from './entities/diffusion-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DiffusionLog])],
  controllers: [DiffusionLogController],
  providers: [DiffusionLogService],
})
export class DiffusionLogModule {}
