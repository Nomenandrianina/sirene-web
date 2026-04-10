import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Souscription } from '@/souscription/entities/souscription.entity';

export enum Periode {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

@Entity('pack_type')
export class PackType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string; // ex: "premium", "medium", "basique"

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  /**
   * Nombre de diffusions par jour (dans les créneaux autorisés)
   * premium = 3, medium = 1, basique = 0 (pas de diffusion quotidienne)
   */
  @Column({ type: 'int', name: 'frequence_par_jour', default: 1 })
  frequenceParJour: number;

  /**
   * Nombre de jours de diffusion par semaine
   * premium = 7, medium = 7, basique = 3
   */
  @Column({ type: 'int', name: 'jours_par_semaine', default: 7 })
  joursParSemaine: number;

  /**
   * Jours de la semaine autorisés pour le pack basique
   * ex: [1, 3, 5] = lundi, mercredi, vendredi (ISO: 1=lundi, 7=dimanche)
   * NULL = tous les jours autorisés
   */
  @Column({ type: 'simple-array', name: 'jours_autorises', nullable: true })
  joursAutorises: number[] | null;

  /**
   * Durée maximale du créneau en minutes (15 ou 20)
   */
  @Column({ type: 'int', name: 'duree_max_minutes', default: 15 })
  dureeMaxMinutes: number;

  /**
   * Prix du pack
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  prix: number;

  @Column({
    type: 'enum',
    enum: Periode,
    default: Periode.MONTHLY,
  })
  periode: Periode;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Souscription, (s) => s.packType)
  souscriptions: Souscription[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}