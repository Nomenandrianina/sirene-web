import { PartialType } from '@nestjs/mapped-types';
import { CreateSendAlerteBngrcDto } from './create-send-alerte-bngrc.dto';

export class UpdateSendAlerteBngrcDto extends PartialType(CreateSendAlerteBngrcDto) {}
