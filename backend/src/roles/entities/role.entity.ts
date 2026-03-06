// src/roles/role.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Permission } from '../../permissions/entities/permission.entity';
import { User } from '../../users/entities/user.entity';
import { BaseEntity } from 'src/common/entity/base.entity';

@Entity('roles')
export class Role extends BaseEntity{
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // ex: "ADMIN"

  @ManyToMany(() => Permission, permission => permission.roles, { eager: true })
  @JoinTable()
  permissions: Permission[];

}
