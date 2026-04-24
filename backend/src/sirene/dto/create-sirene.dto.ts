import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateSireneDto {
    
    @IsNotEmpty()
    @IsString()
    name: string | null;
  
    @IsNotEmpty()
    @IsString()
    imei: string | null;
    
    @IsNotEmpty()
    @IsString()
    latitude: string | null;
    
    @IsNotEmpty()
    @IsString()
    longitude: string | null;
    
    @IsNotEmpty()
    @IsString()
    phoneNumberBrain: string | null;
    
    @IsNotEmpty()
    @IsString()
    phoneNumberRelai: string | null;
   
    @IsOptional()
    @IsEnum(['SMS', 'DATA'])
    communicationType?: 'SMS' | 'DATA';
    
    @IsNotEmpty()
    @IsNumber()
    villageId: number;
    
    @IsNumber()
    isActive: number;

    @IsString()
    fcmToken!: string;

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    customerIds?: number[];
    
}
