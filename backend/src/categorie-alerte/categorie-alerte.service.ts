import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CategorieAlerte } from "./entities/categorie-alerte.entity";
import { CreateCategorieAlerteDto } from "./dto/create-categorie-alerte.dto";
import { UpdateCategorieAlerteDto } from "./dto/update-categorie-alerte.dto";

@Injectable()
export class CategorieAlerteService {
  constructor(
    @InjectRepository(CategorieAlerte)
    private readonly repo: Repository<CategorieAlerte>,
  ) {}

  findAll(alerteTypeId?: number) {
    return this.repo.find({
      where: alerteTypeId ? { alerteTypeId } : {},
      relations: ["alerteType", "sousCategories"],
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id }, relations: ["alerteType", "sousCategories"] });
    if (!item) throw new NotFoundException(`CategorieAlerte #${id} introuvable`);
    return item;
  }

  create(dto: CreateCategorieAlerteDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: number, dto: UpdateCategorieAlerteDto) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { message: "Catégorie supprimée" };
  }
}