import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notification } from "./entities/notification.entity";
import { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";
import { PlaybackTimeoutNotificationTask } from "./playback-timeout-notification.task";
import { User } from "src/users/entities/user.entity";
import { Notificationsweb } from "src/notificationsweb/entities/notificationsweb.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Notification,User,Notificationsweb])],
  controllers: [NotificationController],
  providers: [NotificationService,PlaybackTimeoutNotificationTask],
  exports: [NotificationService], // exporté pour le service d'envoi d'alertes
})

export class NotificationModule {}