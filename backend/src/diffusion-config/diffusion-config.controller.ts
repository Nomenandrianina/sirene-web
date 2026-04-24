import { Controller, Get, Post, Body, Patch, Param, Delete, Put, HttpCode, HttpStatus } from '@nestjs/common';
import { DiffusionConfigService } from './diffusion-config.service';
import { CreateDiffusionConfigDto } from './dto/create-diffusion-config.dto';
import { UpdateDiffusionConfigDto } from './dto/update-diffusion-config.dto';
import { UpsertDiffusionConfigDto } from './dto/upsert-diffusion-config.dto';

@Controller('diffusion-config')
export class DiffusionConfigController {
  constructor(private readonly diffusionConfigService: DiffusionConfigService,) {}

  @Post()
  create(@Body() createDiffusionConfigDto: CreateDiffusionConfigDto) {
    return this.diffusionConfigService.create(createDiffusionConfigDto);
  }

  @Get()
  findAll() {
    return this.diffusionConfigService.findAllActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.diffusionConfigService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDiffusionConfigDto: UpdateDiffusionConfigDto) {
    return this.diffusionConfigService.update(+id, updateDiffusionConfigDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) 
  remove(@Param('id') id: string) {
    return this.diffusionConfigService.delete(+id);
  }

  @Put()
  async upsert(@Body() dto: UpsertDiffusionConfigDto) {
    return this.diffusionConfigService.upsert(dto); // le service gère le rechargement
  }

}
