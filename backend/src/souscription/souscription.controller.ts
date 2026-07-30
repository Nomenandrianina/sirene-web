import {  Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, Query, HttpCode, HttpStatus, Req, } from '@nestjs/common';
import { SouscriptionService } from './souscription.service';
import { CreateSouscriptionDto,UpdateSouscriptionDto,SouscriptionQueryDto,AdminCreateSouscriptionDto,} from './dto/create-souscription.dto';
import { ScheduleUpgradeDto } from './dto/schedule-upgrade.dto';

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
  update( @Param('id', ParseIntPipe) id: number,@Body() dto: UpdateSouscriptionDto) {
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

  /**
+   * PATCH /souscriptions/:id/schedule-upgrade
+   * Le client demande un changement de pack — appliqué au prochain cycle
+   */
  @Patch(':id/schedule-upgrade')
  scheduleUpgrade(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any, // ⚠️ adaptez selon votre décorateur d'auth existant (ex: @CurrentUser())
    @Body() dto: ScheduleUpgradeDto,
  ) {
    const customerId = req.user.customerId; // ⚠️ jamais dto.customerId — vérifiez que req.user est bien peuplé par votre JwtAuthGuard
    return this.service.scheduleUpgrade(id, customerId, dto.packTypeId);
  }

  /**
   * DELETE /souscriptions/:id/schedule-upgrade
   * Le client annule sa demande de changement en attente
   */
  @Delete(':id/schedule-upgrade')
  cancelScheduledUpgrade(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const customerId = req.user.customerId;
    return this.service.cancelScheduledUpgrade(id, customerId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}