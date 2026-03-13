import {
  Controller, Get, Delete, Patch,
  Param, Query, Body, ParseIntPipe,
} from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { NotificationStatus } from "./entities/notification.entity";
import { UpdateNotificationStatusDto } from "./dto/update-notification.dto";

@Controller("notifications")
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  findAll(
    @Query("sireneId")              sireneId?:              string,
    @Query("status")                status?:                NotificationStatus,
    @Query("startDate")             startDate?:             string,
    @Query("endDate")               endDate?:               string,
    @Query("sousCategorieAlerteId") sousCategorieAlerteId?: string,
    @Query("userId")                userId?:                string,
    @Query("page")                  page?:                  string,
    @Query("limit")                 limit?:                 string,
  ) {
    return this.service.findAll({
      sireneId:              sireneId              ? +sireneId              : undefined,
      status,
      startDate,
      endDate,
      sousCategorieAlerteId: sousCategorieAlerteId ? +sousCategorieAlerteId : undefined,
      userId:                userId                ? +userId                : undefined,
      page:                  page                  ? +page                  : 1,
      limit:                 limit                 ? +limit                 : 20,
    });
  }

  @Get("stats")
  getStats() {
    return this.service.getStats();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // PATCH status — pour callback Orange ou correction manuelle
  @Patch(":id/status")
  updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateNotificationStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}