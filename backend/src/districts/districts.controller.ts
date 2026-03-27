import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DistrictsService } from './districts.service';
import { CreateDistrictDto } from './dto/create-district.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';
import { Audit } from 'src/audit-log/decorators/audit.decorator';

@Controller('districts')
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) {}

  @Audit('CREATE', 'Districts')
  @Post()
  create(@Body() createDistrictDto: CreateDistrictDto) {
    return this.districtsService.create(createDistrictDto);
  }

  @Get()
  findAll() {
    return this.districtsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.districtsService.findOne(+id);
  }

  @Audit('UPDATE', 'Districts')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDistrictDto: UpdateDistrictDto) {
    return this.districtsService.update(+id, updateDistrictDto);
  }

  @Audit('DELETE', 'Districts')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.districtsService.remove(+id);
  
    return {
      success: true,
      message: 'District supprimée avec succès',
    };
  }

}
