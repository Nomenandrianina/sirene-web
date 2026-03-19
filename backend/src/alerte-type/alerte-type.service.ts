import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository,In } from "typeorm";
import { AlerteType } from "@/alerte-type/entities/alerte-type.entity";
import { CreateAlerteTypeDto } from "./dto/create-alerte-type.dto";
import { UpdateAlerteTypeDto } from "./dto/update-alerte-type.dto";
import { Customer } from "@/customers/entity/customer.entity";

@Injectable()
export class AlerteTypeService {
  constructor(
    @InjectRepository(AlerteType) private readonly repo: Repository<AlerteType>,
    @InjectRepository(Customer)   private readonly customerRepo: Repository<Customer>,
  ) {}
 
  // isSuperAdmin = true  → tout retourner
  // customerId   = number → retourner uniquement les types assignés à ce client
  async findAll(alerteId?: number, isSuperAdmin = true, customerId?: number) {
    const qb = this.repo.createQueryBuilder("t")
      .leftJoinAndSelect("t.alerte",    "alerte")
      .leftJoinAndSelect("t.customers", "customers")
      .where("t.deleted_at IS NULL");

    if (alerteId) {
      qb.andWhere("t.alerteId = :alerteId", { alerteId });
    }
 
    // Filtre client : INNER JOIN sur la table pivot
    if (!isSuperAdmin && customerId) {
      qb.innerJoin("t.customers", "c", "c.id = :cid", { cid: customerId });
    }
 
    return qb.orderBy("t.id", "ASC").getMany();
  }
 
  async findOne(id: number) {
    const item = await this.repo.findOne({
      where: { id },
      relations: ["alerte", "customers"],
    });
    if (!item) throw new NotFoundException(`AlerteType #${id} introuvable`);
    return item;
  }
 
  async create(dto: CreateAlerteTypeDto) {
    
    const item = this.repo.create({ name: dto.name, alerteId: dto.alerteId });
 
    if (dto.customerIds?.length) {
      item.customers = await this.customerRepo.findBy({ id: In(dto.customerIds) });
    } else {
      item.customers = [];
    }
 
    return this.repo.save(item);
  }
 
  async update(id: number, dto: UpdateAlerteTypeDto) {
    const item = await this.findOne(id);
    
    if (dto.name     !== undefined) item.name     = dto.name;
    if (dto.alerteId !== undefined) item.alerteId = dto.alerteId;
 
    if (dto.customerIds !== undefined) {
      item.customers = dto.customerIds.length
        ? await this.customerRepo.findBy({ id: In(dto.customerIds) })
        : [];
    }
    return this.repo.save(item);
  }
 
  async remove(id: number) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { message: `AlerteType #${id} supprimé` };
  }
}