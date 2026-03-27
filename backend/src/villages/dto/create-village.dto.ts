import { IsNotEmpty, IsNumber, IsString, isNotEmpty } from "class-validator";

export class CreateVillageDto {

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    latitude: string;
    
    @IsNotEmpty()
    longitude: string;

    @IsNotEmpty()
    @IsNumber()
    provinceId: number;

    @IsNotEmpty()
    @IsNumber()
    regionId:number;

    @IsNotEmpty()
    @IsNumber()
    districtId:number;

    @IsNotEmpty()
    @IsNumber()
    communeId: number;
   
    @IsNotEmpty()
    @IsNumber()
    fokontanyId: number;
}
