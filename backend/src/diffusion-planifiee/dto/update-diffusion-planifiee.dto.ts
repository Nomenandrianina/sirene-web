import { PartialType } from '@nestjs/mapped-types';
import { CreateDiffusionPlanifieeDto } from './create-diffusion-planifiee.dto';

export class UpdateDiffusionPlanifieeDto extends PartialType(CreateDiffusionPlanifieeDto) {}
