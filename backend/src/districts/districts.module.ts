import { Module } from '@nestjs/common';
import { DistrictsService } from './districts.service';
import { DistrictsController } from './districts.controller';
import { District } from './entities/district.entity';
import { Region } from 'src/regions/entities/region.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([District, Region])],
  controllers: [DistrictsController],
  providers: [DistrictsService],
  exports:[DistrictsService]
})
export class DistrictsModule {}
