import { PartialType } from '@nestjs/mapped-types';
import { CreateTypeAlerteBngrcDto } from './create-type-alerte-bngrc.dto';

export class UpdateTypeAlerteBngrcDto extends PartialType(CreateTypeAlerteBngrcDto) {}
