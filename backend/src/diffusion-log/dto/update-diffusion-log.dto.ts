import { PartialType } from '@nestjs/mapped-types';
import { CreateDiffusionLogDto } from './create-diffusion-log.dto';

export class UpdateDiffusionLogDto extends PartialType(CreateDiffusionLogDto) {}
