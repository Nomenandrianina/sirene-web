import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationBngrcDto } from './create-notification-bngrc.dto';

export class UpdateNotificationBngrcDto extends PartialType(CreateNotificationBngrcDto) {}
