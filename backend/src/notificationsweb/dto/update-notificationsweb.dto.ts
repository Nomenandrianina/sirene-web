import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationswebDto } from './create-notificationsweb.dto';

export class UpdateNotificationswebDto extends PartialType(CreateNotificationswebDto) {}
