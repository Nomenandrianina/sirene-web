import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VillagesService } from './villages.service';
import { CreateVillageDto } from './dto/create-village.dto';
import { UpdateVillageDto } from './dto/update-village.dto';
import { Audit } from 'src/audit-log/decorators/audit.decorator';

@Controller('villages')
export class VillagesController {
  constructor(private readonly villagesService: VillagesService) {}

  @Audit('CREATE', 'Villages')
  @Post()
  create(@Body() createVillageDto: CreateVillageDto) {
    return this.villagesService.create(createVillageDto);
  }

  
  @Get()
  findAll() {
    return this.villagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.villagesService.findOne(+id);
  }

  @Audit('UPDATE', 'Villages')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVillageDto: UpdateVillageDto) {
    return this.villagesService.update(+id, updateVillageDto);
  }

  @Audit('DELETE', 'Villages')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.villagesService.remove(+id);
  }
}
