import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { Permission } from './entities/permission.entity';
import { Repository } from 'typeorm/repository/Repository';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';

@Injectable()
export class PermissionsService {
    constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async create(dto: CreatePermissionDto) {
    const exists = await this.permissionRepo.findOne({
      where: { name: dto.name },
    });

    if (exists) {
      throw new ConflictException('Permission already exists');
    }

    return this.permissionRepo.save(this.permissionRepo.create(dto));
  }

  findAll() {
    return this.permissionRepo.find();
  }

  async findOne(id: number) {
    const permission = await this.permissionRepo.findOne({ where: { id } });
    if (!permission) throw new NotFoundException('Permission not found');
    return permission;
  }

  async update(id: number, dto: UpdatePermissionDto) {
    await this.findOne(id);
    await this.permissionRepo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const permission = await this.findOne(id);
    return this.permissionRepo.remove(permission);
  }
}
