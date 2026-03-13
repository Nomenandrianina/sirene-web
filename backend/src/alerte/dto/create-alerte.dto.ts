import { IsNotEmpty, IsString, IsArray, IsNumber, IsOptional } from "class-validator";

export class CreateAlerteDto {
  @IsNotEmpty() @IsString()
  name: string;

  @IsOptional() @IsArray() @IsNumber({}, { each: true })
  customerIds?: number[];
}