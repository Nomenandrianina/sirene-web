import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fokontany } from './entities/fokontany.entity';
import { FokontanyService } from './fokontany.service';
import { FokontanyController } from './fokontany.controller';
import { Commune } from '@/commune/entities/commune.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Fokontany, Commune])],
  controllers: [FokontanyController],
  providers: [FokontanyService],
  exports: [FokontanyService, TypeOrmModule],
})
export class FokontanyModule {}