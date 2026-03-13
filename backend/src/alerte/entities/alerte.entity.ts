import {Entity, PrimaryGeneratedColumn, Column,OneToMany, ManyToMany, JoinTable, DeleteDateColumn,} from "typeorm";
import { AlerteType } from "@/alerte-type/entities/alerte-type.entity";
import { Customer } from "src/customers/entity/customer.entity";

@Entity("alerte")
export class Alerte {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 45 })
    name: string;

    // ManyToMany avec Customer via table pivot alerte_client
    @ManyToMany(() => Customer, { eager: false })
    @JoinTable({
        name: "alerte_client",
        joinColumn:        { name: "alerte_id",    referencedColumnName: "id" },
        inverseJoinColumn: { name: "customers_id", referencedColumnName: "id" },
    })
    customers: Customer[];

    @OneToMany(() => AlerteType, t => t.alerte, { cascade: true })
    types: AlerteType[];

    @DeleteDateColumn({ name: "deleted_at" })
    deletedAt?: Date;
}