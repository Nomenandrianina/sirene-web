import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateRoleDto {
    @IsOptional()
    @IsString()
    name?: string;
  
    @IsOptional()
    @IsArray()
    @Transform(({ obj }) => obj.permission_ids ?? obj.permissionIds)
    permissionIds?: number[];
  }