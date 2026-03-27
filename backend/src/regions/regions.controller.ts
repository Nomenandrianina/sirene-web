import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { Audit } from 'src/audit-log/decorators/audit.decorator';

@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}
 
  @Audit('CREATE', 'Region')
  @Post()
  create(@Body() createRegionDto: CreateRegionDto) {
    return this.regionsService.create(createRegionDto);
  }

  @Get()
  findAll() {
    return this.regionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.regionsService.findOne(+id);
  } 

  @Audit('UPDATE', 'Region')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRegionDto: UpdateRegionDto) {
    return this.regionsService.update(+id, updateRegionDto);
  }

  @Audit('DELETE', 'Region')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.regionsService.remove(+id);
  
    return {
      success: true,
      message: 'Region supprimée avec succès',
    };
  }
  
}
