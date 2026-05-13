import { IsInt, IsOptional, IsArray, IsString, IsISO8601 } from 'class-validator';
import { Transform } from 'class-transformer';

export class SendAlerteBngrcDto {
  // Catégorie BNGRC sélectionnée (porte directement l'audio)
  @IsInt()
  categorieAlerteBngrcId: number;

  // Zones géographiques — même logique que SendAlerteDto existant
  @IsArray() @IsOptional()
  provinceIds?: number[];

  @IsArray() @IsOptional()
  regionIds?: number[];

  @IsArray() @IsOptional()
  districtIds?: number[];

  @IsArray() @IsOptional()
  villageIds?: number[];

  // Planification
  @IsISO8601() @IsOptional()
  sendingTimeAfterAlerte?: string;

  // Répétition
  @IsOptional()
  repeatCount?: number;

  @IsOptional()
  repeatInterval?: string; // ex: "5min", "2h"

  // Priorité — toujours P1 pour BNGRC (urgence)
  @IsString() @IsOptional()
  alertPriority?: 'P1' | 'P2';

  @IsInt() @IsOptional()
  userId?: number;
}
