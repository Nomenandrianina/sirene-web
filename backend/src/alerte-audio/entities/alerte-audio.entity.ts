import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn, CreateDateColumn, UpdateDateColumn,Index } from "typeorm";
import { SousCategorieAlerte } from "@/sous-categorie-alerte/entities/sous-categorie-alerte.entity";

@Entity("alerte_audio")
export class AlerteAudio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 45, nullable: true })
  name: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  description: string | null;

  // Identifiant unique généré côté app mobile pour sync offline
  @Column({ type: "varchar", name: "mobile_id", length: 100, unique: true })
  mobileId: string| null;

  // Chemin du fichier stocké sur le serveur (ex: /uploads/audios/filename.mp3)
  @Column({ length: 255 })
  audio: string;

  // Nom original du fichier uploadé
  @Column({ name: "original_filename", type: "varchar", length: 255, nullable: true })
  originalFilename: string | null;

  // Taille en bytes
  @Column({ name: "file_size", type: "int", nullable: true })
  fileSize: number;

  // Durée en secondes (à renseigner côté client ou via ffprobe)
  @Column({ name: "duration", type: "float", nullable: true })
  duration: number | null;

  @Index({ unique: true })
  @Column({ name: "sous_categorie_alerte_id" })
  sousCategorieAlerteId: number;

  
  @ManyToOne(() => SousCategorieAlerte, s => s.audios, { onDelete: "CASCADE" })
  @JoinColumn({ name: "sous_categorie_alerte_id" })
  sousCategorie: SousCategorieAlerte;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;
}