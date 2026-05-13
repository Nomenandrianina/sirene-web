import { Module } from '@nestjs/common';
import { CategorieAlerteBngrcService } from './categorie-alerte-bngrc.service';
import { CategorieAlerteBngrcController } from './categorie-alerte-bngrc.controller';
import { CategorieAlerteBngrc } from './entities/categorie-alerte-bngrc.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:     [TypeOrmModule.forFeature([CategorieAlerteBngrc])],
  controllers: [CategorieAlerteBngrcController],
  providers: [CategorieAlerteBngrcService],
  exports:     [CategorieAlerteBngrcService],

})
export class CategorieAlerteBngrcModule {}
