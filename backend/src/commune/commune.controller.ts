import { Controller,Get,Post,Patch,Delete,Body,Param,ParseIntPipe,Query,HttpCode,HttpStatus,} from '@nestjs/common';
import { CommunesService } from './commune.service';
import { CreateCommuneDto } from './dto/create-commune.dto';
import { UpdateCommuneDto } from './dto/update-commune.dto';

@Controller('communes')
export class CommunesController {
  constructor(private readonly communesService: CommunesService) {}

  // POST /communes
  @Post()
  create(@Body() dto: CreateCommuneDto) {
    return this.communesService.create(dto);
  }

  // GET /communes
  // GET /communes?districtId=3
  @Get()
  findAll(@Query('districtId') districtId?: string) {
    if (districtId) {
      return this.communesService.findByDistrict(+districtId);
    }
    return this.communesService.findAll();
  }

  // GET /communes/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.communesService.findOne(id);
  }

  // PATCH /communes/:id
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommuneDto,
  ) {
    return this.communesService.update(id, dto);
  }

  // DELETE /communes/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.communesService.remove(id);
  }
}