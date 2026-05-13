import { IsString, IsNotEmpty, IsOptional, IsInt, MaxLength } from 'class-validator';

export class CreateTypeAlerteBngrcDto {
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
  alerteBngrcId: number;
}

export class UpdateTypeAlerteBngrcDto {
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
  alerteBngrcId?: number;
}
