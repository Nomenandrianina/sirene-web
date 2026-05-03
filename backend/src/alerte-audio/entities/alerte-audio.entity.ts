import { Entity, PrimaryGeneratedColumn,ManyToMany, JoinTable, Column, ManyToOne, JoinColumn, DeleteDateColumn, CreateDateColumn, UpdateDateColumn,Index } from "typeorm";
import { SousCategorieAlerte } from "@/sous-categorie-alerte/entities/sous-categorie-alerte.entity";
import { Sirene } from "@/sirene/entities/sirene.entity";
import { Customer } from "src/customers/entity/customer.entity";
import { User } from "src/users/entities/user.entity";


export enum AudioValidationStatus {
  PENDING   = 'pending',
  APPROVED  = 'approved',
  REJECTED  = 'rejected',
}


// alerte-audio.entity.ts
@Entity("alerte_audio")
export class AlerteAudio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 45, nullable: true })
  name: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  description: string | null;

  @Column({ type: "varchar", name: "mobile_id", length: 100, unique: true })
  mobileId: string | null;

  @Column({ length: 255 })
  audio: string;

  @Column({ name: "original_filename", type: "varchar", length: 255, nullable: true })
  originalFilename: string | null;

  @Column({ name: "file_size", type: "int", nullable: true })
  fileSize: number;

  @Column({ name: "duration", type: "float", nullable: true })
  duration: number | null;

  @Column({ name: 'sous_categorie_alerte_id' })
  sousCategorieAlerteId: number;

  // ← SUPPRIMÉ : sireneId simple
  // ← AJOUTÉ : relation ManyToMany

  @ManyToMany(() => Sirene, { eager: true, onDelete: 'CASCADE' })
  @JoinTable({
    name:              'alerte_audio_sirene',
    joinColumn:        { name: 'alerte_audio_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'sirene_id',       referencedColumnName: 'id' },
  })
  sirenes: Sirene[];

  @Column({ name: 'customer_id', nullable: true })
  customerId: number | null;

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => SousCategorieAlerte, s => s.audios, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sous_categorie_alerte_id" })
  sousCategorie: SousCategorieAlerte;

  @Column({ type: 'enum', enum: AudioValidationStatus, default: AudioValidationStatus.PENDING })
  status: AudioValidationStatus;

  @Column({ type: 'text', name: 'rejection_comment', nullable: true })
  rejectionComment: string | null;

  @Column({ name: 'created_by_user_id', type: 'int', nullable: true })
  createdByUserId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;
}