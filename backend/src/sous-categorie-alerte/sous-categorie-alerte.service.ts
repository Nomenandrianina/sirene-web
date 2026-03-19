import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SousCategorieAlerte } from "./entities/sous-categorie-alerte.entity";
import { CreateSousCategorieAlerteDto } from "./dto/create-sous-categorie-alerte.dto";
import { UpdateSousCategorieAlerteDto } from "./dto/update-sous-categorie-alerte.dto";

@Injectable()
export class SousCategorieAlerteService {
  constructor(
    @InjectRepository(SousCategorieAlerte)
    private readonly repo: Repository<SousCategorieAlerte>,
  ) {}

  findAll(categorieAlerteId?: number) {
    return this.repo.find({
      where: categorieAlerteId ? { categorieAlerteId } : {},
      relations: ["categorieAlerte", "alerte", "alerteType", "audios"],
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id },
      relations: ["categorieAlerte", "alerte", "alerteType", "audios"],
    });
    if (!item) throw new NotFoundException(`SousCategorieAlerte #${id} introuvable`);
    return item;
  }

  create(dto: CreateSousCategorieAlerteDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: number, dto: UpdateSousCategorieAlerteDto) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { message: "Sous-catégorie supprimée" };
  }
}