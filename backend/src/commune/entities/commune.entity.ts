import { Entity,PrimaryGeneratedColumn,Column,ManyToOne,JoinColumn,OneToMany,} from 'typeorm';
import { District } from '@/districts/entities/district.entity';
import { Fokontany } from '@/fokontany/entities/fokontany.entity';

@Entity('communes')
export class Commune {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ name: 'district_id' })
    districtId: number;

    @ManyToOne(() => District, { eager: true, onDelete: 'NO ACTION' })
    @JoinColumn({ name: 'district_id' })
    district: District;

    @OneToMany(() => Fokontany, (fokontany) => fokontany.commune)
    fokontanys: Fokontany[];
}