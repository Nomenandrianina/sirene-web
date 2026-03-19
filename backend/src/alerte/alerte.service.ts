import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Alerte } from "./entities/alerte.entity";
import { Customer } from "../customers/entity/customer.entity";
import { CreateAlerteDto } from "./dto/create-alerte.dto";
import { UpdateAlerteDto } from "./dto/update-alerte.dto";

@Injectable()
export class AlerteService {
  constructor(
    @InjectRepository(Alerte)
    private readonly repo: Repository<Alerte>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  // isSuperAdmin=true → tous les alertes
  // isSuperAdmin=false → seulement ceux liés au customer de l'utilisateur
  findAll(isSuperAdmin = true, customerId?: number) {
    const qb = this.repo
      .createQueryBuilder("alerte")
      .leftJoinAndSelect("alerte.customers", "customer")
      .leftJoinAndSelect("alerte.types", "type")
      .where("alerte.deleted_at IS NULL");

    if (!isSuperAdmin && customerId) {
      qb.andWhere("customer.id = :customerId", { customerId });
    }

    return qb.getMany();
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id },
      relations: ["customers", "types"],
    });
    if (!item) throw new NotFoundException(`Alerte #${id} introuvable`);
    return item;
  }

  async create(dto: CreateAlerteDto) {
    const { customerIds, ...rest } = dto;
    const alerte = this.repo.create(rest);

    if (customerIds?.length) {
      alerte.customers = await this.customerRepo.findBy({ id: In(customerIds) });
    } else {
      alerte.customers = [];
    }

    return this.repo.save(alerte);
  }

  async update(id: number, dto: UpdateAlerteDto) {
    const { customerIds, ...rest } = dto;
    const alerte = await this.findOne(id);

    Object.assign(alerte, rest);

    if (customerIds !== undefined) {
      alerte.customers = customerIds.length
        ? await this.customerRepo.findBy({ id: In(customerIds) })
        : [];
    }

    return this.repo.save(alerte);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { message: "Alerte supprimée" };
  }
}