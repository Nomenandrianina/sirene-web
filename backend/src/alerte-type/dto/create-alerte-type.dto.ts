import { IsNumber, IsOptional, IsString, MinLength,IsArray,IsNotEmpty ,} from 'class-validator';
import { Type } from "class-transformer";

export class CreateAlerteTypeDto {
       
    @IsNotEmpty()
    @IsString()
    name: string | null;


    @IsNotEmpty() @Type(() => Number) @IsNumber()
    alerteId: number;

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    customerIds?: number[];
    
}
