import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { NotificationBngrcService } from './notification-bngrc.service';
import { CreateNotificationBngrcDto } from './dto/create-notification-bngrc.dto';
import { UpdateNotificationBngrcDto } from './dto/update-notification-bngrc.dto';
import { NotificationBngrcStatus } from './entities/notification-bngrc.entity';

@Controller('notification-bngrc')
export class NotificationBngrcController {
  constructor(private readonly notificationBngrcService: NotificationBngrcService) {}

  // @Post()
  // create(@Body() createNotificationBngrcDto: CreateNotificationBngrcDto) {
  //   return this.notificationBngrcService.create(createNotificationBngrcDto);
  // }
      
  @Get()
  findAll(
    @Query('sireneId') sireneId?: string,
    @Query('status') status?: NotificationBngrcStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('categorieAlerteBngrcId') categorieAlerteBngrcId?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {

    return this.notificationBngrcService.findAll({
      sireneId: sireneId ? +sireneId : undefined,
      status,
      startDate,
      endDate,
      categorieAlerteBngrcId: categorieAlerteBngrcId ? +categorieAlerteBngrcId : undefined,
      userId: userId ? +userId : undefined,
      page: page ? +page : 1,
      limit: limit ? +limit : 20,
    });
  }
  
  @Get('active')
  getActive(@Query('lookbackMin')  lookbackMin  = '30', @Query('lookaheadMin') lookaheadMin = '5'  ) {
    return this.notificationBngrcService.getActiveForMap(
      parseInt(lookbackMin,  10),
      parseInt(lookaheadMin, 10),
    );
  }
  
  @Get('stats')
  getStats( @Query('startDate') startDate?: string,  @Query('endDate') endDate?: string) {
    return this.notificationBngrcService.getStats({
      startDate,
      endDate,
    });
  }

  /**
   * GET /notification-bngrc/history?date=2026-06-14&hour=14
   * Retourne toutes les notifications BNGRC (status=sent) dont
   * sendingTime ∈ [date 14:00:00, date 14:59:59]
   */
  @Get('history') 
  getHistory(@Query('date') date: string, @Query('hour') hour: string,) {
    return this.notificationBngrcService.getHistory(date, parseInt(hour, 10));
  }

  // Controller
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.notificationBngrcService.findOne(id);
  }
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateNotificationBngrcDto: UpdateNotificationBngrcDto) {
  //   return this.notificationBngrcService.update(+id, updateNotificationBngrcDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationBngrcService.remove(+id);
  }

}
