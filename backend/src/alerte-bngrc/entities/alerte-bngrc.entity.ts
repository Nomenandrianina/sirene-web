import {Entity,PrimaryGeneratedColumn,Column,OneToMany,CreateDateColumn,UpdateDateColumn,DeleteDateColumn,} from 'typeorm';
import { TypeAlerteBngrc } from '../../type-alerte-bngrc/entities/type-alerte-bngrc.entity';
  
@Entity('alerte_bngrc')
export class AlerteBngrc {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    description: string | null;

    @OneToMany(() => TypeAlerteBngrc, (type) => type.alerte, { cascade: true })
    types: TypeAlerteBngrc[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt?: Date;
}
  