import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  first_name?: string;

  @IsString()
  last_name?: string;

  @IsString()
  number?: string;
  
  @IsString()
  country?: string;

  @IsString()
  state?: string;
}
