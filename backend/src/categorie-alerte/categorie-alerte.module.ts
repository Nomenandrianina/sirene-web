import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategorieAlerte } from "./entities/categorie-alerte.entity";
import { CategorieAlerteService } from "./categorie-alerte.service";
import { CategorieAlerteController } from "./categorie-alerte.controller";

@Module({
  imports: [TypeOrmModule.forFeature([CategorieAlerte])],
  controllers: [CategorieAlerteController],
  providers: [CategorieAlerteService],
  exports: [CategorieAlerteService],
})
export class CategorieAlerteModule {}