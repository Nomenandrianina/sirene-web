import { PartialType } from '@nestjs/mapped-types';
import { CreateCategorieAlerteDto } from './create-categorie-alerte.dto';

export class UpdateCategorieAlerteDto extends PartialType(CreateCategorieAlerteDto) {}
