import { User } from 'src/users/entities/user.entity';
import {Entity,PrimaryGeneratedColumn,Column,ManyToOne,JoinColumn,CreateDateColumn} from 'typeorm';

@Entity('notifications_web') 
export class Notificationsweb {

    @PrimaryGeneratedColumn('increment', { type: 'bigint' })
    id: number;

    @Column({ type: 'varchar' })
    type: string;          // ex: 'AUDIO_PENDING', 'AUDIO_APPROVED', 'AUDIO_REJECTED'

    @Column({ type: 'varchar' })
    message: string;

    @Column({ nullable: true })
    entityType: string;    // ex: 'alerte_audio'

    @Column({ type: 'bigint', nullable: true })
    entityId: number;

    @Column({ type: 'varchar', length: 500, nullable: true })
    url: string | null;    // ex: '/alerte-audios/42'

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
