import { Module } from '@nestjs/common';
import { AlerteBngrcService } from './alerte-bngrc.service';
import { AlerteBngrcController } from './alerte-bngrc.controller';
import { AlerteBngrc } from './entities/alerte-bngrc.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:     [TypeOrmModule.forFeature([AlerteBngrc])],
  controllers: [AlerteBngrcController],
  providers: [AlerteBngrcService],
  exports:     [AlerteBngrcService],

})
export class AlerteBngrcModule {}
