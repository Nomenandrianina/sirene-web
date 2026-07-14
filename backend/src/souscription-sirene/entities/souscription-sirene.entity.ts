// souscription-sirene.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique,} from 'typeorm';
import { Souscription } from '@/souscription/entities/souscription.entity';
  
@Entity('souscription_sirene')
@Unique(['souscriptionId', 'sireneId'])
export class SouscriptionSirene {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'souscription_id' })
    souscriptionId: number;

    @Column({ name: 'sirene_id' })
    sireneId: number;

    /** Copié depuis pack.nombreCredits au moment de la création — sert de référence pour l'affichage "X / Y" */
    @Column({ type: 'int', name: 'nombre_credits', nullable: true, default: null })
    nombreCredits: number | null;

    @Column({ type: 'int', name: 'credits_restants', nullable: true, default: null })
    creditsRestants: number | null;

    @ManyToOne(() => Souscription, (s) => s.souscriptionSirenes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'souscription_id' })
    souscription: Souscription;

    @ManyToOne('Sirene', { eager: true })
    @JoinColumn({ name: 'sirene_id' })
    sirene: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}