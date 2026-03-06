// src/permissions/permission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base.entity';

@Entity('provinces')
export class Province extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
