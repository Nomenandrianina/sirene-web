import {Controller,Get,Post,Patch,Delete,Body,Param,ParseIntPipe,Query,HttpCode,HttpStatus,} from '@nestjs/common';
import { PacktypeService } from './packtype.service';
import { CreatePackTypeDto, UpdatePackTypeDto } from './dto/create-packtype.dto';

@Controller('pack-types')
export class PacktypeController {
  constructor(private readonly service: PacktypeService) {}

  /**
   * GET /pack-types
   * Liste tous les packs (admin: tous | client: seulement actifs)
   */
  @Get()
  findAll(@Query('active') active?: string) {
    const onlyActive = active === 'true';
    return this.service.findAll(onlyActive);
  }

  /**
   * GET /pack-types/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  /**
   * POST /pack-types
   * Créer un nouveau pack (admin uniquement)
   */
  @Post()
  create(@Body() dto: CreatePackTypeDto) {
    return this.service.create(dto);
  }

  /**
   * PATCH /pack-types/:id
   * Modifier un pack existant
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePackTypeDto,
  ) {
    return this.service.update(id, dto);
  }

  /**
   * DELETE /pack-types/:id
   * Soft delete (désactivation)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  /**
   * DELETE /pack-types/:id/hard
   * Suppression définitive (admin uniquement)
   */
  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  hardDelete(@Param('id', ParseIntPipe) id: number) {
    return this.service.hardDelete(id);
  }

  /**
   * POST /pack-types/seed
   * Initialiser les 3 packs de base
   */
  @Post('seed')
  seed() {
    return this.service.seedPacks();
  }
}