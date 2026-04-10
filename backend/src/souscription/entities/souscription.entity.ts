import {Entity,PrimaryGeneratedColumn,Column,CreateDateColumn,UpdateDateColumn,ManyToOne,JoinColumn,OneToMany,ManyToMany,JoinTable} from 'typeorm';
import { PackType } from '@/packtype/entities/packtype.entity';
import { DiffusionLog } from '@/diffusion-log/entities/diffusion-log.entity';

export enum SouscriptionStatus {
  ACTIVE    = 'active',
  EXPIRED   = 'expired',
  SUSPENDED = 'suspended',
  PENDING   = 'pending',
}

@Entity('souscription')
export class Souscription {
  @PrimaryGeneratedColumn()
  id: number;

  /** User qui a souscrit */
  @Column({ name: 'user_id' })
  userId: number;

  /** Customer auquel appartient la souscription */
  @Column({ name: 'customer_id' })
  customerId: number;

  @Column({ name: 'pack_type_id' })
  packTypeId: number;

  /**
   * Nullable — le client associe ses audios après la souscription
   * via son interface de gestion d'audios
   */
  @Column({  name: 'alerte_audio_id',type: 'int', nullable: true,})
  alerteAudioId: number | null;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SouscriptionStatus,
    default: SouscriptionStatus.ACTIVE,
  })
  status: SouscriptionStatus;

  // ── Relations ─────────────────────────────────────────────────────────────

  @ManyToOne(() => PackType, (p) => p.souscriptions, { eager: true })
  @JoinColumn({ name: 'pack_type_id' })
  packType: PackType;

  /**
   * Une souscription couvre 1..N sirènes.
   * Table pivot : souscription_sirene(souscription_id, sirene_id)
   */
  @ManyToMany('Sirene', { eager: false })
  @JoinTable({
    name: 'souscription_sirene',
    joinColumn:        { name: 'souscription_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'sirene_id',        referencedColumnName: 'id' },
  })
  sirenes: any[];

  @OneToMany(() => DiffusionLog, (d) => d.souscription)
  diffusionLogs: DiffusionLog[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}