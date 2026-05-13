import { Module } from '@nestjs/common';
import { NotificationBngrcService } from './notification-bngrc.service';
import { NotificationBngrcController } from './notification-bngrc.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationBngrc } from './entities/notification-bngrc.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationBngrc])],
  controllers: [NotificationBngrcController],
  providers: [NotificationBngrcService],
  exports: [NotificationBngrcService],
})
export class NotificationBngrcModule {}
