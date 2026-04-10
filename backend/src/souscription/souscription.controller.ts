import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseIntPipe, Query, HttpCode, HttpStatus,
} from '@nestjs/common';
import { SouscriptionService } from './souscription.service';
import {
  CreateSouscriptionDto,
  UpdateSouscriptionDto,
  SouscriptionQueryDto,
  AdminCreateSouscriptionDto,
} from './dto/create-souscription.dto';

@Controller('souscriptions')
export class SouscriptionController {
  constructor(private readonly service: SouscriptionService) {}

  /**
   * GET /souscriptions
   * Liste avec filtres : ?userId=1 &customerId=2 &status=active
   */
  @Get()
  findAll(@Query() query: SouscriptionQueryDto) {
    return this.service.findAll(query);
  }

  /**
   * GET /souscriptions/user/:userId
   * Toutes les souscriptions d'un user (vue client)
   */
  @Get('user/:userId')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.findByUser(userId);
  }

  /**
   * GET /souscriptions/customer/:customerId
   * Toutes les souscriptions d'un customer (vue superadmin)
   */
  @Get('customer/:customerId')
  findByCustomer(@Param('customerId', ParseIntPipe) customerId: number) {
    return this.service.findByCustomer(customerId);
  }

  /**
   * GET /souscriptions/customer/:customerId/has-active
   * Vérifie si un customer a une souscription active (pour le banner)
   */
  @Get('customer/:customerId/has-active')
  hasActive(@Param('customerId', ParseIntPipe) customerId: number) {
    return this.service.hasActiveSouscription(customerId);
  }

  /**
   * GET /souscriptions/:id
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  /**
   * POST /souscriptions
   * Création par le client lui-même
   */
  @Post()
  create(@Body() dto: CreateSouscriptionDto) {
    return this.service.create(dto);
  }

  /**
   * POST /souscriptions/admin
   * Création par le superadmin pour le compte d'un client
   * (même logique, userId et customerId fournis explicitement)
   */
  @Post('admin')
  adminCreate(@Body() dto: AdminCreateSouscriptionDto) {
    return this.service.create(dto);
  }

  /**
   * PATCH /souscriptions/:id
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSouscriptionDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/suspend')
  suspend(@Param('id', ParseIntPipe) id: number) {
    return this.service.suspend(id);
  }

  @Patch(':id/reactivate')
  reactivate(@Param('id', ParseIntPipe) id: number) {
    return this.service.reactivate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}