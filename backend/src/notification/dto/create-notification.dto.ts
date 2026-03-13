import { IsOptional, IsNotEmpty, IsString, IsNumber, IsEnum, IsDateString } from "class-validator";
import { NotificationStatus, OrangeStatus } from "../entities/notification.entity";
import { Type } from "class-transformer";

export class CreateNotificationDto {
  @IsOptional() @IsString()  type?: string;
  @IsOptional() @IsString()  operator?: string;
  @IsOptional() @IsEnum(NotificationStatus) status?: NotificationStatus;
  @IsNotEmpty() @IsString()  message: string;
  @IsOptional() @IsString()  messageId?: string;
  @IsOptional() @IsDateString() sendingTime?: string;
  @IsOptional() @IsString()  operatorStatus?: string;
  @IsOptional() @IsString()  phoneNumber?: string;
  @IsOptional() @Type(()=>Number) @IsNumber() weatherId?: number;
  @IsOptional() @Type(()=>Number) @IsNumber() alerteAudioId?: number;
  @IsNotEmpty() @Type(()=>Number) @IsNumber() sireneId: number;
  @IsNotEmpty() @Type(()=>Number) @IsNumber() sousCategorieAlerteId: number;
  @IsOptional() @IsEnum(OrangeStatus) orangeStatus?: OrangeStatus;
  @IsOptional() @Type(()=>Number) @IsNumber() userId?: number;
  @IsOptional() @IsString()  observation?: string;
  @IsOptional() @IsDateString() sendingTimeAfterAlerte?: string;
}