import { IsNotEmpty, IsNumber, IsOptional, IsDateString, IsArray } from "class-validator";
import { Type } from "class-transformer";

export class SendAlerteDto {
  @IsNotEmpty() @Type(()=>Number) @IsNumber()
  alerteId: number;

  @IsNotEmpty() @Type(()=>Number) @IsNumber()
  alerteTypeId: number;

  @IsNotEmpty() @Type(()=>Number) @IsNumber()
  categorieAlerteId: number;

  @IsNotEmpty() @Type(()=>Number) @IsNumber()
  sousCategorieAlerteId: number;

  // Zones géographiques pour filtrer les sirènes
  @IsOptional() @IsArray() @Type(()=>Number)
  provinceIds?: number[];

  @IsOptional() @IsArray() @Type(()=>Number)
  regionIds?: number[];

  @IsOptional() @IsArray() @Type(()=>Number)
  districtIds?: number[];

  // Heure planifiée — absent = maintenant
  @IsOptional() @IsDateString()
  sendingTimeAfterAlerte?: string;

  // Utilisateur qui déclenche l'envoi
  @IsOptional() @Type(()=>Number) @IsNumber()
  userId?: number;
}