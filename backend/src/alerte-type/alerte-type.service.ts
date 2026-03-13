import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AlerteType } from "@/alerte-type/entities/alerte-type.entity";
import { CreateAlerteTypeDto } from "./dto/create-alerte-type.dto";
import { UpdateAlerteTypeDto } from "./dto/update-alerte-type.dto";

@Injectable()
export class AlerteTypeService {
  constructor(
    @InjectRepository(AlerteType)
    private readonly repo: Repository<AlerteType>,
  ) {}

  findAll(alerteId?: number) {
    return this.repo.find({
      where: alerteId ? { alerteId } : {},
      relations: ["alerte", "categories"],
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id }, relations: ["alerte", "categories"] });
    if (!item) throw new NotFoundException(`AlerteType #${id} introuvable`);
    return item;
  }

  create(dto: CreateAlerteTypeDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: number, dto: UpdateAlerteTypeDto) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.repo.softDelete(id);
    return { message: "Type d'alerte supprimé" };
  }
}