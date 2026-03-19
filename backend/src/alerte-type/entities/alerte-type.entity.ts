import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, DeleteDateColumn,ManyToMany,JoinTable } from "typeorm";
import { Alerte } from "@/alerte/entities/alerte.entity";
import { CategorieAlerte } from "@/categorie-alerte/entities/categorie-alerte.entity";
import { Customer } from "@/customers/entity/customer.entity";

@Entity("alerte_type")
export class AlerteType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({type: "varchar", length: 45, nullable: true })
  name: string | null;

  @Column({ name: "Alerte_id" })
  alerteId: number;

  @ManyToOne(() => Alerte, a => a.types, { onDelete: "CASCADE" })
  @JoinColumn({ name: "Alerte_id" })
  alerte: Alerte;

  @OneToMany(() => CategorieAlerte, c => c.alerteType, { cascade: true })
  categories: CategorieAlerte[];

  @ManyToMany(() => Customer, { eager: false })
  @JoinTable({
    name:              "alerte_type_client",
    joinColumn:        { name: "alerte_type_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "customer_id",    referencedColumnName: "id" },
  })
  customers: Customer[];


  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;
}