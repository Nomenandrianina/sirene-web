import { PartialType } from '@nestjs/mapped-types';
import { CreateFokontanyDto } from './create-fokontany.dto';

export class UpdateFokontanyDto extends PartialType(CreateFokontanyDto) {}
