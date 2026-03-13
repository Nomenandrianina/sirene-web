import { PartialType } from '@nestjs/mapped-types';
import { CreateSousCategorieAlerteDto } from './create-sous-categorie-alerte.dto';

export class UpdateSousCategorieAlerteDto extends PartialType(CreateSousCategorieAlerteDto) {}
