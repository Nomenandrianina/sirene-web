import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProvincesService } from './provinces.service';
import { CreateProvinceDto } from './dto/create-province.dto';
import { UpdateProvinceDto } from './dto/update-province.dto';
import { Audit } from 'src/audit-log/decorators/audit.decorator';
import { PermissionsGuard }   from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/guards/require-permission.decorator';


@Controller('provinces')
@UseGuards(PermissionsGuard)
export class ProvincesController {
  constructor(private readonly provincesService: ProvincesService) {}

  @Audit('CREATE', 'Province')
  @Post()
  @RequirePermission('provinces:create')
  create(@Body() createProvinceDto: CreateProvinceDto) {
    return this.provincesService.create(createProvinceDto);
  }

  @Get()
  @RequirePermission('provinces:read')
  findAll() {
    return this.provincesService.findAll();
  }

  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.provincesService.findOne(+id);
  }

  
  @Audit('UPDATE', 'Province')
  @Patch(':id')
  @RequirePermission('provinces:update')
  update(@Param('id') id: string, @Body() updateProvinceDto: UpdateProvinceDto) {
    return this.provincesService.update(+id, updateProvinceDto);
  }

  
  @Audit('DELETE', 'Province')
  @RequirePermission('provinces:delete')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.provincesService.remove(+id);
  
    return {
      success: true,
      message: 'Province supprimée avec succès',
    };
  }
}
