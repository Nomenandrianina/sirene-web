import { IsString, IsNotEmpty } from 'class-validator';

export class RegisterSireneDto {
  @IsString()
  @IsNotEmpty()
  imei: string;

  @IsString()
  @IsNotEmpty()
  fcmToken: string;
}