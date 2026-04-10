import {
    IsInt, IsOptional, IsDateString, IsEnum,
    IsArray, ArrayMinSize,
  } from 'class-validator';
  import { SouscriptionStatus } from '../entities/souscription.entity';
  import { PartialType } from '@nestjs/mapped-types';
  
  export class CreateSouscriptionDto {
    /** User qui souscrit (extrait du JWT en production) */
    @IsInt()
    userId: number;
  
    /** Customer auquel appartient la souscription */
    @IsInt()
    customerId: number;
  
    @IsInt()
    packTypeId: number;
  
    /**
     * Liste des sirènes sélectionnées (1 minimum)
     */
    @IsArray()
    @ArrayMinSize(1)
    @IsInt({ each: true })
    sireneIds: number[];
  
    /**
     * Date de début optionnelle (défaut = aujourd'hui)
     */
    @IsOptional()
    @IsDateString()
    startDate?: string;
  }
  
  export class UpdateSouscriptionDto extends PartialType(CreateSouscriptionDto) {
    @IsOptional()
    @IsEnum(SouscriptionStatus)
    status?: SouscriptionStatus;
  }
  
  export class SouscriptionQueryDto {
    @IsOptional()
    @IsInt()
    userId?: number;
  
    @IsOptional()
    @IsInt()
    customerId?: number;
  
    @IsOptional()
    @IsEnum(SouscriptionStatus)
    status?: SouscriptionStatus;
  }
  
  /** DTO utilisé par le superadmin pour assigner un pack à un client */
  export class AdminCreateSouscriptionDto extends CreateSouscriptionDto {
    // customerId et userId sont fournis explicitement par l'admin
  }