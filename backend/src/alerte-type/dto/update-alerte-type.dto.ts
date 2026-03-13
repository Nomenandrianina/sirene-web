import { PartialType } from '@nestjs/mapped-types';
import { CreateAlerteTypeDto } from './create-alerte-type.dto';

export class UpdateAlerteTypeDto extends PartialType(CreateAlerteTypeDto) {}
