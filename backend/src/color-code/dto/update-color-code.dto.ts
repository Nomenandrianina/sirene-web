import { PartialType } from '@nestjs/mapped-types';
import { CreateColorCodeDto } from './create-color-code.dto';

export class UpdateColorCodeDto extends PartialType(CreateColorCodeDto) {}
