import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { NotificationswebService } from './notificationsweb.service';
import { CreateNotificationswebDto } from './dto/create-notificationsweb.dto';
import { UpdateNotificationswebDto } from './dto/update-notificationsweb.dto';

@Controller('notificationsweb')
export class NotificationswebController {
  constructor(private readonly notificationswebService: NotificationswebService) {}



  /** Toutes les notifs (50 dernières) — utilisé pour le dropdown */
  @Get()
  getAll(@Request() req: any) {
    return this.notificationswebService.getAll(req.user.sub);
  }

  /** Marquer une notif comme lue */
  @Patch(':id/read')
  markRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationswebService.markRead(+id, req.user.sub);
  }

  /** Tout marquer comme lu */
  @Patch('read-all')
  markAllRead(@Request() req: any) {
    return this.notificationswebService.markAllRead(req.user.sub);
  }

  
  /** Notifs non lues — utilisé pour le badge dans la cloche */
  @Get('unread')
  getUnread(@Request() req: any) {
    return this.notificationswebService.getUnread(req.user.sub);
  }

  @Post()
  create(@Body() createNotificationswebDto: CreateNotificationswebDto) {
    return this.notificationswebService.create(createNotificationswebDto);
  }

  @Get()
  findAll() {
    return this.notificationswebService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationswebService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotificationswebDto: UpdateNotificationswebDto) {
    return this.notificationswebService.update(+id, updateNotificationswebDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationswebService.remove(+id);
  }
}
