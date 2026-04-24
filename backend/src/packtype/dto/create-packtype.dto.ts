import {IsString,IsInt,IsOptional,IsEnum,IsBoolean,IsNumber,IsArray,Min,Max,MinLength,} from 'class-validator';
import { Periode } from '../entities/packtype.entity';
import { PartialType } from '@nestjs/mapped-types';
  
export class CreatePackTypeDto {
    @IsString()
    @MinLength(2)
    name: string;
  
    @IsOptional()
    @IsString()
    description?: string;
  
    @IsInt()
    @Min(0)
    @Max(3)
    frequenceParJour: number;
  
    @IsInt()
    @Min(1)
    @Max(7)
    joursParSemaine: number;
  
    /**
     * Jours ISO autorisés (1=lundi ... 7=dimanche)
     * Laisser vide = tous les jours
     */
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    joursAutorises?: number[] | null;;
  
    @IsInt()
    @Min(5)
    @Max(60)
    dureeMaxMinutes: number;
  
    @IsNumber()
    @Min(0)
    prix: number;
  
    @IsEnum(Periode)
    periode: Periode;
  
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsInt() @Min(0) @Max(23)
    heure: number;
  
    @IsInt() @Min(0) @Max(59)
    minute: number;
    
}
  
export class UpdatePackTypeDto extends PartialType(CreatePackTypeDto) {}