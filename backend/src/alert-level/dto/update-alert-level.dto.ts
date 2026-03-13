import { PartialType } from '@nestjs/mapped-types';
import { CreateAlertLevelDto } from './create-alert-level.dto';

export class UpdateAlertLevelDto extends PartialType(CreateAlertLevelDto) {}
