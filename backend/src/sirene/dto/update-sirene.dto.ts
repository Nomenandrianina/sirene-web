import { PartialType } from '@nestjs/mapped-types';
import { CreateSireneDto } from './create-sirene.dto';

export class UpdateSireneDto extends PartialType(CreateSireneDto) {}
