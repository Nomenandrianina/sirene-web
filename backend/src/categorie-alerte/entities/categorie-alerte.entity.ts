import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, DeleteDateColumn } from "typeorm";
import { AlerteType } from "@/alerte-type/entities/alerte-type.entity";
import { SousCategorieAlerte } from "@/sous-categorie-alerte/entities/sous-categorie-alerte.entity";

@Entity("categorie_alerte")
export class CategorieAlerte {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 45, nullable: true })
  name: string;

  @Column({ name: "alerte_type_id" })
  alerteTypeId: number;

  @ManyToOne(() => AlerteType, t => t.categories, { onDelete: "CASCADE" })
  @JoinColumn({ name: "alerte_type_id" })
  alerteType: AlerteType;

  @OneToMany(() => SousCategorieAlerte, s => s.categorieAlerte, { cascade: true })
  sousCategories: SousCategorieAlerte[];

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;
}