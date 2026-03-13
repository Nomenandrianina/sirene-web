import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ColorCodeService } from './color-code.service';
import { CreateColorCodeDto } from './dto/create-color-code.dto';
import { UpdateColorCodeDto } from './dto/update-color-code.dto';

@Controller('color-code')
export class ColorCodeController {
  constructor(private readonly colorCodeService: ColorCodeService) {}

  @Post()
  create(@Body() createColorCodeDto: CreateColorCodeDto) {
    return this.colorCodeService.create(createColorCodeDto);
  }

  @Get()
  findAll() {
    return this.colorCodeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.colorCodeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateColorCodeDto: UpdateColorCodeDto) {
    return this.colorCodeService.update(+id, updateColorCodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.colorCodeService.remove(+id);
  }
}
