import { Controller, Get, Post, Body, Patch, Param, Delete, Request, BadRequestException } from '@nestjs/common';
import { NotificationswebService } from './notificationsweb.service';
import { CreateNotificationswebDto } from './dto/create-notificationsweb.dto';
import { UpdateNotificationswebDto } from './dto/update-notificationsweb.dto';

@Controller('notificationsweb')
export class NotificationswebController {
  constructor(private readonly notificationswebService: NotificationswebService) {}


  @Post('read-all-notification')          // ← doit être AVANT @Patch(':id')
  markAllRead(@Request() req: any) {
    return this.notificationswebService.markAllRead(req.user.sub);
  }

  @Patch(':id/read')          // ← spécifique, ok
  markRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationswebService.markRead(+id, req.user.sub);
  }

  @Patch(':id')               // ← générique, doit être EN DERNIER
  update(@Param('id') id: string, @Body() dto: UpdateNotificationswebDto) {
    return this.notificationswebService.update(+id, dto);
  }

  /** Notifs non lues — utilisé pour le badge dans la cloche */
  @Get('unread')
  getUnread(@Request() req: any) {
    return this.notificationswebService.getUnread(req.user.sub);
  }

  /** Toutes les notifs (50 dernières) — utilisé pour le dropdown */
  @Get()
  getAll(@Request() req: any) {
    return this.notificationswebService.getAll(req.user.sub);
  }

  @Post()
  create(@Body() createNotificationswebDto: CreateNotificationswebDto) {
    return this.notificationswebService.create(createNotificationswebDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationswebService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationswebService.remove(+id);
  }
}
