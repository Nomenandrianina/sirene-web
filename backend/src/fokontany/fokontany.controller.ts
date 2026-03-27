import {Controller,Get,Post,Patch,Delete,Body,Param,ParseIntPipe,Query,HttpCode,HttpStatus,} from '@nestjs/common';
import { FokontanyService } from './fokontany.service';
import { CreateFokontanyDto } from './dto/create-fokontany.dto';
import { UpdateFokontanyDto } from './dto/update-fokontany.dto';

@Controller('fokontany')
export class FokontanyController {
  constructor(private readonly fokontanyService: FokontanyService) {}

  // POST /fokontany
  @Post()
  create(@Body() dto: CreateFokontanyDto) {
    return this.fokontanyService.create(dto);
  }

  // GET /fokontany
  // GET /fokontany?communeId=5
  @Get()
  findAll(@Query('communeId') communeId?: string) {
    if (communeId) {
      return this.fokontanyService.findByCommune(+communeId);
    }
    return this.fokontanyService.findAll();
  }

  // GET /fokontany/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fokontanyService.findOne(id);
  }

  // PATCH /fokontany/:id
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFokontanyDto,
  ) {
    return this.fokontanyService.update(id, dto);
  }

  // DELETE /fokontany/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fokontanyService.remove(id);
  }
}