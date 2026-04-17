import { Notification } from 'src/notification/entities/notification.entity';
import { Souscription } from 'src/souscription/entities/souscription.entity';
import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn,ManyToOne ,JoinColumn
  } from 'typeorm';
  
  export enum PlanningStatus {
    PLANNED   = 'planned',
    PENDING   = 'pending',
    SENT      = 'sent',
    FAILED    = 'failed',
    CANCELLED = 'cancelled',
  }
  
  @Entity('planning_diffusion')
  export class PlanningDiffusion {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ name: 'souscription_id' })
    souscriptionId: number;
  
    @Column({ name: 'sirene_id' })
    sireneId: number;
  
    @Column({ 
        type: 'int',   
        name: 'alerte_audio_id',
        nullable: true 
      })
      alerteAudioId: number | null;
  
    @Column({ type: 'datetime', name: 'scheduled_at' })
    scheduledAt: Date;
  
    @Column({
      type: 'enum',
      enum: PlanningStatus,
      default: PlanningStatus.PLANNED,
    })
    status: PlanningStatus;
  
    @Column({ type: 'int', name: 'notification_id', nullable: true })
    notificationId: number | null;
  
    @Column({ nullable: true })
    message: string;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => Souscription)
    @JoinColumn({ name: 'souscription_id' })
    souscription: Souscription;
   

  }