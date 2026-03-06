import { IsNotEmpty, IsString, MaxLength, IsInt } from "class-validator";


export class CreateAuditLogDto {
  @IsInt()
  userId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  action: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  entity: string;

  @IsInt()
  entityId: number;
}
