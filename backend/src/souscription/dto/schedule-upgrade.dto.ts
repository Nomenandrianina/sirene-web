// souscription/dto/schedule-upgrade.dto.ts
import { IsInt, IsPositive } from 'class-validator';

export class ScheduleUpgradeDto {
  @IsInt()
  @IsPositive()
  packTypeId: number;
}