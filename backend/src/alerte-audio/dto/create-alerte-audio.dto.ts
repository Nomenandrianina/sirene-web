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


  @IsArray()
  @IsInt({ each: true })
  sireneIds: number[];
  
  // audio, originalFilename, fileSize sont renseignés automatiquement
  // depuis le fichier uploadé (Multer) — ne pas envoyer depuis le client
}