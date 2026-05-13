import { IsString, IsNotEmpty, IsOptional,IsInt, IsArray, IsEnum, MaxLength,} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AudioBngrcStatus } from '../entities/audio-alerte-bngrc.entity';
  
export class CreateAudioAlerteBngrcDto {
    @IsString()
    @IsOptional()
    @MaxLength(45)
    name?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(255)
    description?: string;
  
    // mobileId N'EST PLUS envoyé par le frontend — généré automatiquement backend
    // à partir du nom de la catégorie BNGRC + timestamp
  
    // categorieAlerteBngrcId vient du form-data (multipart) → string à parser
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @IsNotEmpty()
    categorieAlerteBngrcId: number;
  
    // IDs des sirènes associées — envoyées en multipart comme JSON string ou tableau
    @IsOptional()
    @Transform(({ value }) => {
      if (Array.isArray(value)) return value.map(Number);
      if (typeof value === 'string') {
        try { return JSON.parse(value).map(Number); }
        catch { return [Number(value)]; }
      }
      return [];
    })
    @IsArray()
    @IsInt({ each: true })
    sireneIds?: number[];
  
    @IsOptional()
    @IsInt()
    @Transform(({ value }) => parseInt(value, 10))
    createdByUserId?: number;
}

export class UpdateAudioAlerteBngrcDto {
    @IsString()
    @IsOptional()
    @MaxLength(45)
    name?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(255)
    description?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(100)
    mobileId?: string;
  
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    categorieAlerteBngrcId?: number;
  
    @IsOptional()
    @Transform(({ value }) => {
      if (Array.isArray(value)) return value.map(Number);
      if (typeof value === 'string') {
        try { return JSON.parse(value).map(Number); }
        catch { return [Number(value)]; }
      }
      return [];
    })
    @IsArray()
    @IsInt({ each: true })
    sireneIds?: number[];
}
  

export class ValidateAudioBngrcDto {
    @IsEnum(AudioBngrcStatus)
    status: AudioBngrcStatus;

    @IsString()
    @IsOptional()
    rejectionComment?: string;
}
  