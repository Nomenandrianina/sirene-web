import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm/find-options/operator/In';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import { Repository } from 'typeorm/repository/Repository';
import { CreateRoleDto } from './dto/create-role.dto';
import { Permission } from 'src/permissions/entities/permission.entity';
import { Role } from './entities/role.entity';
import { PermissionsService } from 'src/permissions/permissions.service';

@Injectable()
export class RolesService {
    constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    private permissionsService: PermissionsService,
  ) {}

  async create(dto: CreateRoleDto) {
    const exists = await this.roleRepo.findOne({
      where: { name: dto.name },
    });

    if (exists) {
      throw new ConflictException('Role already exists');
    }

    const role = this.roleRepo.create({
      name: dto.name
    });

    if (dto.permissionIds?.length) {
        const permissions = await this.permissionRepo.findBy({
          id: In(dto.permissionIds),
        });

        if (permissions.length !== dto.permissionIds.length) {
        throw new BadRequestException('Some permissions do not exist');
        }

        role.permissions = permissions;
    }

    return this.roleRepo.save(role);
  }

  async findAll():  Promise<Role[]> {
    return this.roleRepo.find({ relations: ['permissions'] });
  }

  async findOne(id: number):  Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Le rôle avec l'id ${id} n'existe pas`);
    }
    return role;
  }

  async update(id: number, dto: UpdateRoleDto) {
    const role = await this.roleRepo.findOne({
      where: { id: id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Rôle non trouvé');
    }

    if (dto.permissionIds) {
      const permissions = await this.permissionRepo.findBy({
        id: In(dto.permissionIds),
      });
      role.permissions = permissions;
    }

    if (dto.name) role.name = dto.name;

    return this.roleRepo.save(role);
  }

  async remove(id: number) {
    const role = await this.findOne(id);
    return this.roleRepo.remove(role);
  }

  async syncAdminPermissions() {
    const adminRole = await this.roleRepo.findOne({
      where: { name: 'Administrateur' },
      relations: ['permissions'], // charge les permissions existantes
    });

    if (!adminRole) {
      throw new NotFoundException('Le rôle administrateur est introuvable');
    }

    // Récupérer toutes les permissions existantes
    const allPermissions = await this.permissionsService.findAll();

    // Attribuer toutes les permissions au rôle admin
    adminRole.permissions = allPermissions;

    // Sauvegarder le rôle avec ses nouvelles permissions
    await this.roleRepo.save(adminRole);
  }
}
