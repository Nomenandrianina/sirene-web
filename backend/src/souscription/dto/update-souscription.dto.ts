import { PartialType } from '@nestjs/mapped-types';
import { CreateSouscriptionDto } from './create-souscription.dto';

export class UpdateSouscriptionDto extends PartialType(CreateSouscriptionDto) {}
