import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, DeleteDateColumn } from "typeorm";
import { CategorieAlerte } from "@/categorie-alerte/entities/categorie-alerte.entity";
import { Alerte } from "@/alerte/entities/alerte.entity";
import { AlerteType } from "@/alerte-type/entities/alerte-type.entity";
import { AlerteAudio } from "@/alerte-audio/entities/alerte-audio.entity";

@Entity("sous_categorie_alerte")
export class SousCategorieAlerte {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 45, nullable: true })
  name: string;

  @Column({ name: "categorie_alerte_id" })
  categorieAlerteId: number;

  @Column({ name: "alerte_id" })
  alerteId: number;

  @Column({ name: "alerte_type_id" })
  alerteTypeId: number;

  @ManyToOne(() => CategorieAlerte, c => c.sousCategories, { onDelete: "CASCADE" })
  @JoinColumn({ name: "categorie_alerte_id" })
  categorieAlerte: CategorieAlerte;

  @ManyToOne(() => Alerte, { eager: true })
  @JoinColumn({ name: "alerte_id" })
  alerte: Alerte;

  @ManyToOne(() => AlerteType, { eager: false })
  @JoinColumn({ name: "alerte_type_id" })
  alerteType: AlerteType;

  @OneToMany(() => AlerteAudio, a => a.sousCategorie, { cascade: true })
  audios: AlerteAudio[];

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;
}