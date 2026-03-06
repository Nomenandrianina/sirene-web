import { BaseEntity } from "src/common/entity/base.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('audit_logs')
export class AuditLog extends BaseEntity{
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 255 })
  action: string;

  @Column({ length: 100 })
  entity: string;

  @Column({ name: 'entity_id' })
  entityId: number;

  @Column({ type: 'timestamp' })
  date: Date;
}
