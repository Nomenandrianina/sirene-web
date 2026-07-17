import { User } from 'src/users/entities/user.entity';
import {Entity,PrimaryGeneratedColumn,Column,ManyToOne,JoinColumn,CreateDateColumn} from 'typeorm';

@Entity('notifications_web') 
export class Notificationsweb {

    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    @Column({ type: 'varchar' })
    type: string;          

    @Column({ type: 'varchar' })
    message: string;

    @Column({ nullable: true })
    entityType: string;  

    @Column({ type: 'bigint', nullable: true })
    entityId: number;

    @Column({ type: 'varchar', length: 500, nullable: true })
    url: string | null;   

    @Column({ type: 'boolean', default: false })
    isRead: boolean;

    @Column({ name: "user_id", type: "int", nullable: true })
    userId: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: "NO ACTION" })
    @JoinColumn({ name: "user_id" })
    user: User;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

}
