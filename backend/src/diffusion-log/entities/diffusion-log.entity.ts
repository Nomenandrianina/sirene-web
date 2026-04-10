import {Entity,PrimaryGeneratedColumn,Column,CreateDateColumn,ManyToOne,JoinColumn,} from 'typeorm';
import { Souscription } from '@/souscription/entities/souscription.entity';
  
export enum DiffusionStatus {
    SENT = 'sent',
    FAILED = 'failed',
}
  
@Entity('diffusion_log')
export class DiffusionLog {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ name: 'souscription_id' })
    souscriptionId: number;
  
    // Heure planifiée réelle dans le créneau (avec offset calculé)
    @Column({ type: 'timestamp', name: 'scheduled_at' })
    scheduledAt: Date;
  
    // Heure réelle d'envoi du message au cerveau
    @Column({ type: 'timestamp', name: 'sent_at', nullable: true })
    sentAt: Date | null;
  
    @Column({
      type: 'enum',
      enum: DiffusionStatus,
    })
    status: DiffusionStatus;
  
    @Column({ type: 'text', nullable: true })
    error: string | null;
  
    // Message brut envoyé (utile pour debug)
    @Column({ type: 'text', name: 'raw_message', nullable: true })
    rawMessage: string | null;
  
    @ManyToOne(() => Souscription, (s) => s.diffusionLogs)
    @JoinColumn({ name: 'souscription_id' })
    souscription: Souscription;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}