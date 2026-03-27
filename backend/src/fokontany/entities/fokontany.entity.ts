import {Entity,PrimaryGeneratedColumn,Column,ManyToOne,JoinColumn,OneToMany,} from 'typeorm';
import { Commune } from '@/commune/entities/commune.entity';
import { Village } from '@/villages/entities/village.entity';
  
@Entity('fokontany')
export class Fokontany {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ name: 'commune_id' })
    communeId: number;

    @ManyToOne(() => Commune, { eager: true, onDelete: 'NO ACTION' })
    @JoinColumn({ name: 'commune_id' })
    commune: Commune;

    @OneToMany(() => Village, (village) => village.fokontany)
    villages: Village[];
}