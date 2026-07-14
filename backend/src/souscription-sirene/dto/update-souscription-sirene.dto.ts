import { PartialType } from '@nestjs/mapped-types';
import { CreateSouscriptionSireneDto } from './create-souscription-sirene.dto';

export class UpdateSouscriptionSireneDto extends PartialType(CreateSouscriptionSireneDto) {}
