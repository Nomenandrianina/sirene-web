import { Module } from '@nestjs/common';
import { RegionsService } from './regions.service';
import { RegionsController } from './regions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Region } from './entities/region.entity';
import { Province } from 'src/provinces/entities/province.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Region, Province])],
  controllers: [RegionsController],
  providers: [RegionsService],
  exports: [RegionsService],

})
export class RegionsModule {}
