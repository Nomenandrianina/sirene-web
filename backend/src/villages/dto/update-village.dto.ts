import { PartialType } from '@nestjs/mapped-types';
import { CreateVillageDto } from './create-village.dto';

export class UpdateVillageDto extends PartialType(CreateVillageDto) {
    name?: string;
    latitude?: string;
    longitude?: string;
    provinceId?: number;
    regionId?: number;
    districtId?: number;
}
