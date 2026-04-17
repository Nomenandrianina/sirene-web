import { IsOptional, IsNotEmpty, IsString, IsNumber,IsArray,IsInt } from "class-validator";
import { Type } from "class-transformer";

export class CreateAlerteAudioDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  description?: string;

  // Envoyé dans le body multipart
  @IsNotEmpty() @IsString()
  mobileId?: string;

  @IsNotEmpty() @IsNumber() @Type(() => Number)
  sousCategorieAlerteId: number;

  @IsOptional() @IsNumber() @Type(() => Number)
  duration?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()  
  customerId?: number | null;


  @IsArray()
  @IsInt({ each: true })
  sireneIds: number[];
  
  @IsOptional()
  @IsString() 
  newSousCatName?:   string;

  @IsOptional() @Type(() => Number) @IsNumber()
  alerteId?:          number;
  
  @IsOptional() @Type(() => Number) @IsNumber()
  alerteTypeId?:       number;
  
  @IsOptional() 
  @Type(() => Number) 
  @IsNumber() 
  categorieAlerteId?:  number;

  // audio, originalFilename, fileSize sont renseignés automatiquement
  // depuis le fichier uploadé (Multer) — ne pas envoyer depuis le client
}