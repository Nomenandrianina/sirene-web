import { BaseEntity } from "src/common/entity/base.entity";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

// customer.entity.ts
export enum CustomerPriority {
    NORMAL = 'normal',
    URGENT = 'urgent',
  }
  
@Entity('customers')
export class Customer extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: false })
    name?: string;

    @Column({ nullable: true })
    company: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    adresse: string;

    // ← nouveau
    @Column({
        type: 'enum',
        enum: CustomerPriority,
        default: CustomerPriority.NORMAL,
    })
    priority: CustomerPriority;

    @OneToMany(() => User, (user) => user.customer)
    users: User[];
}