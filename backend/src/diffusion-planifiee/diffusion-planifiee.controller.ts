import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DiffusionPlanifieeService } from './diffusion-planifiee.service';
import { CreateDiffusionPlanifieeDto } from './dto/create-diffusion-planifiee.dto';
import { UpdateDiffusionPlanifieeDto } from './dto/update-diffusion-planifiee.dto';

@Controller('diffusion-planifiee')
export class DiffusionPlanifieeController {
  constructor(private readonly diffusionPlanifieeService: DiffusionPlanifieeService) {}

  // @Post()
  // create(@Body() createDiffusionPlanifieeDto: CreateDiffusionPlanifieeDto) {
  //   return this.diffusionPlanifieeService.create(createDiffusionPlanifieeDto);
  // }

  // @Get()
  // findAll() {
  //   return this.diffusionPlanifieeService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.diffusionPlanifieeService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateDiffusionPlanifieeDto: UpdateDiffusionPlanifieeDto) {
  //   return this.diffusionPlanifieeService.update(+id, updateDiffusionPlanifieeDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.diffusionPlanifieeService.remove(+id);
  // }
}
