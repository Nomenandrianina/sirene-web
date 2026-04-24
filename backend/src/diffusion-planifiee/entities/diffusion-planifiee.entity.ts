import { Sirene } from 'src/sirene/entities/sirene.entity';
import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn,
  } from 'typeorm';
  
  export enum DiffusionPlanifieeStatus {
    PLANNED   = 'planned',   // en attente d'envoi
    SENT      = 'sent',      // SMS envoyé au cerveau
    CANCELLED = 'cancelled', // annulé par le client/admin
    SKIPPED   = 'skipped',   // ignoré (ex: aucun audio au moment du cron)
  }

  @Entity('diffusion_planifiee')
  export class DiffusionPlanifiee {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ name: 'souscription_id' })
    souscriptionId: number;
  
    @Column({ name: 'customer_id' })
    customerId: number;
  
    @Column({ name: 'sirene_id' })
    sireneId: number;
    
    /** Date de diffusion prévue — format DATE "2026-04-15" */
    @Column({ name: 'scheduled_date', type: 'date' })
    scheduledDate: string;
  
    /** Créneau horaire : 7 | 12 | 16 */
    @Column({ name: 'scheduled_heure', type: 'int' })
    scheduledHeure: number;
  
    @Column({ type: 'int', name: 'scheduled_minute', default: 0 })
    scheduledMinute: number;

    @Column({
      type: 'enum',
      enum: DiffusionPlanifieeStatus,
      default: DiffusionPlanifieeStatus.PLANNED,
    })
    status: DiffusionPlanifieeStatus;

    @ManyToOne(() => Sirene, { nullable: false })
    @JoinColumn({ name: 'sirene_id' })
    sirene: Sirene;
  
    /**
     * Renseigné après l'envoi SMS — FK vers notification_sirene_alerte
     * Nullable car vide tant que le cron n'a pas tourné
     */
    @Column({ type: 'int' , name: 'notification_id', nullable: true, default: null })
    notificationId: number | null;
  
    /** Raison si skipped ou cancelled */
    @Column({ type: 'varchar', length: 255, nullable: true, default: null })
    observation: string | null;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  }