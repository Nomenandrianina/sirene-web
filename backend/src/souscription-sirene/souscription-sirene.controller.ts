import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SouscriptionSireneService } from './souscription-sirene.service';
import { CreateSouscriptionSireneDto } from './dto/create-souscription-sirene.dto';
import { UpdateSouscriptionSireneDto } from './dto/update-souscription-sirene.dto';

@Controller('souscription-sirene')
export class SouscriptionSireneController {
  constructor(private readonly souscriptionSireneService: SouscriptionSireneService) {}

  @Post()
  create(@Body() createSouscriptionSireneDto: CreateSouscriptionSireneDto) {
    return this.souscriptionSireneService.create(createSouscriptionSireneDto);
  }

  @Get()
  findAll() {
    return this.souscriptionSireneService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.souscriptionSireneService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSouscriptionSireneDto: UpdateSouscriptionSireneDto) {
    return this.souscriptionSireneService.update(+id, updateSouscriptionSireneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.souscriptionSireneService.remove(+id);
  }
}
