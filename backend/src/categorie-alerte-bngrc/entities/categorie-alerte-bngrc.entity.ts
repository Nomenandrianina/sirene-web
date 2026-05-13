import {Entity,PrimaryGeneratedColumn,Column,ManyToOne,OneToMany,JoinColumn,CreateDateColumn,UpdateDateColumn,DeleteDateColumn, } from 'typeorm';
import { TypeAlerteBngrc }  from '../../type-alerte-bngrc/entities/type-alerte-bngrc.entity';
import { AudioAlerteBngrc } from '@/audio-alerte-bngrc/entities/audio-alerte-bngrc.entity';

@Entity('categorie_alerte_bngrc')
export class CategorieAlerteBngrc {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    description: string | null;

    @Column({ name: 'type_alerte_bngrc_id' })
    typeAlerteBngrcId: number;

    // Dénormalisation optionnelle : garder l'alerteBngrcId directement
    // pour simplifier les requêtes sans double JOIN
    @Column({ name: 'alerte_bngrc_id', type: 'int', nullable: true })
    alerteBngrcId: number | null;

    @ManyToOne(() => TypeAlerteBngrc, (t) => t.categories, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'type_alerte_bngrc_id' })
    type: TypeAlerteBngrc;

    // Une catégorie peut avoir plusieurs audios (un par sirène ou groupe de sirènes)
    @OneToMany(() => AudioAlerteBngrc, (a) => a.categorie, { cascade: true })
    audios: AudioAlerteBngrc[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt?: Date;
}
