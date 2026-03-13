import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SousCategorieAlerte } from "./entities/sous-categorie-alerte.entity";
import { SousCategorieAlerteService } from "./sous-categorie-alerte.service";
import { SousCategorieAlerteController } from "./sous-categorie-alerte.controller";

@Module({
  imports: [TypeOrmModule.forFeature([SousCategorieAlerte])],
  controllers: [SousCategorieAlerteController],
  providers: [SousCategorieAlerteService],
  exports: [SousCategorieAlerteService],
})
export class SousCategorieAlerteModule {}