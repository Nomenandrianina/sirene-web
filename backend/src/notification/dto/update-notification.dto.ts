import { IsOptional, IsEnum, IsString } from "class-validator";
import { NotificationStatus, OrangeStatus } from "../entities/notification.entity";

export class UpdateNotificationStatusDto {
  @IsOptional() @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @IsOptional() @IsEnum(OrangeStatus)
  orangeStatus?: OrangeStatus;

  @IsOptional() @IsString()
  operatorStatus?: string;

  @IsOptional() @IsString()
  observation?: string;
}