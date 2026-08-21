import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PlaybackAckStatus } from '../entities/notification.entity';

export class PlaybackAckDto {
  @IsEnum(PlaybackAckStatus)
  status: PlaybackAckStatus;

  @IsOptional() @IsString()
  timestamp?: string;

  @IsOptional() @IsString()
  errorReason?: string;
}