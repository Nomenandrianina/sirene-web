import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Village } from '../villages/entities/village.entity';
import { Weather } from '../weathers/entities/weather.entity';
import { ExportController } from './export.controller';
import { ExportService }    from './export.service';

@Module({
  imports: [TypeOrmModule.forFeature([Village, Weather])],
  controllers: [ExportController],
  providers:   [ExportService],
})
export class ExportModule {}