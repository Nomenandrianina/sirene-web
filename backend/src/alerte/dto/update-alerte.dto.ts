import { PartialType } from '@nestjs/mapped-types';
import { CreateAlerteDto } from './create-alerte.dto';
import { IsOptional, IsString, IsArray, IsNumber } from "class-validator";

export class UpdateAlerteDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsArray() @IsNumber({}, { each: true })
  customerIds?: number[];
}