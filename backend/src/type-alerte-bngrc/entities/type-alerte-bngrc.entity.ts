import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, } from 'typeorm';
import { AlerteBngrc }          from '../../alerte-bngrc/entities/alerte-bngrc.entity';
import { CategorieAlerteBngrc } from '../../categorie-alerte-bngrc/entities/categorie-alerte-bngrc.entity';

@Entity('type_alerte_bngrc')
export class TypeAlerteBngrc {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    description: string | null;

    @Column({ name: 'alerte_bngrc_id' })
    alerteBngrcId: number;

    @ManyToOne(() => AlerteBngrc, (a) => a.types, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'alerte_bngrc_id' })
    alerte: AlerteBngrc;

    @OneToMany(() => CategorieAlerteBngrc, (c) => c.type, { cascade: true })
    categories: CategorieAlerteBngrc[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt?: Date;
}
  