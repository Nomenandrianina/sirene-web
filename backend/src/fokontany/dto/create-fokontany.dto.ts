import { IsNotEmpty, IsString, MaxLength, IsInt, IsPositive } from 'class-validator';

export class CreateFokontanyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsInt()
  @IsPositive()
  communeId: number;
}