// src/permissions/permission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne,JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base.entity';
import { Region } from 'src/regions/entities/region.entity';


@Entity('districts')
export class District extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Region, { eager: true})
  @JoinColumn()
  region: Region;

}
