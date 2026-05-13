import { IsString, IsNotEmpty, IsOptional, IsInt, MaxLength } from 'class-validator';

export class CreateCategorieAlerteBngrcDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @IsNotEmpty()
  typeAlerteBngrcId: number;

  @IsInt()
  @IsOptional()
  alerteBngrcId?: number;
}

export class UpdateCategorieAlerteBngrcDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @IsOptional()
  typeAlerteBngrcId?: number;

  @IsInt()
  @IsOptional()
  alerteBngrcId?: number;
}
