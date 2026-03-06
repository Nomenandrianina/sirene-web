import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  email: string;

  @IsOptional()
  @IsNumber()
  role_id?: number;

  @IsString()
  @MinLength(6)
  password: string;
  
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  number?: string;
  
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;
 
  @IsOptional()
  @IsNumber()
  customer_id?: number;
}
