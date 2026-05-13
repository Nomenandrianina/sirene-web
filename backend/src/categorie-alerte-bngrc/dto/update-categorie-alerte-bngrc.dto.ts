import { PartialType } from '@nestjs/mapped-types';
import { CreateCategorieAlerteBngrcDto } from './create-categorie-alerte-bngrc.dto';

export class UpdateCategorieAlerteBngrcDto extends PartialType(CreateCategorieAlerteBngrcDto) {}
