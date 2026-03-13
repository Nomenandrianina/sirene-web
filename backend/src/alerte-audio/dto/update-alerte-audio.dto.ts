import { IsOptional, IsString, IsNumber } from "class-validator";
import { Type } from "class-transformer";

export class UpdateAlerteAudioDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  mobileId?: string;

  @IsOptional() @IsNumber() @Type(() => Number)
  sousCategorieAlerteId?: number;

  @IsOptional() @IsNumber() @Type(() => Number)
  duration?: number;
}