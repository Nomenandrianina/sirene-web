import { Module } from '@nestjs/common';
import { VillagesService } from './villages.service';
import { VillagesController } from './villages.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Region } from 'src/regions/entities/region.entity';
import { Province } from 'src/provinces/entities/province.entity';
import { Village } from './entities/village.entity';
import { District } from 'src/districts/entities/district.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Village,Region, Province,District])],
  controllers: [VillagesController],
  providers: [VillagesService],
  exports: [VillagesService],
})
export class VillagesModule {}
