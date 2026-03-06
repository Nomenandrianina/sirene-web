// src/permissions/permission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { BaseEntity } from 'src/common/entity/base.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string; // ex: "user.create"

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => Role, role => role.permissions)
  roles: Role[];
}
