// src/permissions/permission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne,JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base.entity';
import { Province } from 'src/provinces/entities/province.entity';


@Entity('regions')
export class Region extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Province, { eager: true})
  @JoinColumn()
  province: Province;

}
