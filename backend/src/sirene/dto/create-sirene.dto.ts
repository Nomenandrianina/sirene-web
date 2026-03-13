import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateSireneDto {
    
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
    
    @IsNotEmpty()
    @IsNumber()
    villageId: number;
    
    @IsNumber()
    isActive: number;

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    customerIds?: number[];
    
}
