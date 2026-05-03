import { Module } from '@nestjs/common';
import { NotificationswebService } from './notificationsweb.service';
import { NotificationswebController } from './notificationsweb.controller';
import { Notificationsweb } from './entities/notificationsweb.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notificationsweb]) // 🔥 OBLIGATOIRE
  ],
  controllers: [NotificationswebController],
  providers: [NotificationswebService],
  exports: [NotificationswebService],
})
export class NotificationswebModule {}
