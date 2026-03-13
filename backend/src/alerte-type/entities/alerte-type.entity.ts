import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, DeleteDateColumn } from "typeorm";
import { Alerte } from "@/alerte/entities/alerte.entity";
import { CategorieAlerte } from "@/categorie-alerte/entities/categorie-alerte.entity";

@Entity("alerte_type")
export class AlerteType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 45, nullable: true })
  name: string;

  @Column({ name: "Alerte_id" })
  alerteId: number;

  @ManyToOne(() => Alerte, a => a.types, { onDelete: "CASCADE" })
  @JoinColumn({ name: "Alerte_id" })
  alerte: Alerte;

  @OneToMany(() => CategorieAlerte, c => c.alerteType, { cascade: true })
  categories: CategorieAlerte[];

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;
}