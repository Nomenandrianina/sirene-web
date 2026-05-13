import { Module } from '@nestjs/common';
import { TypeAlerteBngrcService } from './type-alerte-bngrc.service';
import { TypeAlerteBngrcController } from './type-alerte-bngrc.controller';
import { TypeAlerteBngrc } from './entities/type-alerte-bngrc.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:     [TypeOrmModule.forFeature([TypeAlerteBngrc])],
  controllers: [TypeAlerteBngrcController],
  providers: [TypeAlerteBngrcService],
  exports:     [TypeAlerteBngrcService],
})
export class TypeAlerteBngrcModule {}
