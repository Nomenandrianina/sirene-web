import { PartialType } from '@nestjs/mapped-types';
import { CreateDiffusionConfigDto } from './create-diffusion-config.dto';

export class UpdateDiffusionConfigDto extends PartialType(CreateDiffusionConfigDto) {}
