import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { RolesService } from './roles.service';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

  @Post()
  async create(@Body() dto: CreateRoleDto) {
    const role = await this.rolesService.create(dto);
    return {
      status: 200,
      message: 'Rôle créé avec succès',
      response: role,
    }
  }

  @Get()
  async findAll() {
    const roles = await this.rolesService.findAll();

    return {
      status: 200,
      message: 'Rôles récupérés avec succès',
      response: roles,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const role = await this.rolesService.findOne(id);

    return {
      status: 200,
      message: 'Rôle récupéré avec succès',
      response: role,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    const updatedRole = await this.rolesService.update(id, dto);

    return {
      status: 200,
      message: 'Rôle mis à jour avec succès',
      response: updatedRole,
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.rolesService.remove(id);
    
    return {
      status: 200,
      message: 'Rôle supprimé avec succès',
    };
  }
}
