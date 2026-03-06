import { BaseEntity } from 'src/common/entity/base.entity';
import { Customer } from 'src/customers/entity/customer.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

@Entity('users')
export class User extends BaseEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  first_name?: string;

  @Column({ nullable: true })
  last_name?: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  password_changed_at: Date;

  @ManyToOne(() => Role, { eager: true, nullable: true })
  @JoinColumn()
  role: Role;

  // ✅ FK client_id dans la table users
  @ManyToOne(() => Customer, (customer) => customer.users, {
    nullable: true,
  })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;
}