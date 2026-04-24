import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

// diffusion-config/dto/upsert-diffusion-config.dto.ts
export class UpsertDiffusionConfigDto {
    @IsOptional() @IsInt()
    regionId?: number | null;       // null = global
  
    @IsOptional() @IsString()
    label?: string;
  
    @IsInt() @Min(0) @Max(23)
    sendHour: number;
  
    @IsInt() @Min(0) @Max(59)
    sendMinute: number;
  
    @IsOptional() @IsArray() @IsInt({ each: true }) @Min(0, { each: true }) @Max(6, { each: true })
    sendDays?: number[] | null;     // null = tous les jours
  
    @IsOptional() @IsBoolean()
    isActive?: boolean;
  }
