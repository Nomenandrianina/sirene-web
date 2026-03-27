import { IsNotEmpty, IsString, MaxLength, IsInt, IsPositive } from 'class-validator';

export class CreateCommuneDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsInt()
  @IsPositive()
  districtId: number;
}