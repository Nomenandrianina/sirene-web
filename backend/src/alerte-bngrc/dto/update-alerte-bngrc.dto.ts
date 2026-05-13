import { PartialType } from '@nestjs/mapped-types';
import { CreateAlerteBngrcDto } from './create-alerte-bngrc.dto';

export class UpdateAlerteBngrcDto extends PartialType(CreateAlerteBngrcDto) {}
