import {Entity,PrimaryGeneratedColumn,Column,ManyToOne,ManyToMany,JoinColumn,JoinTable,CreateDateColumn,UpdateDateColumn,DeleteDateColumn,Index,} from 'typeorm';
import { CategorieAlerteBngrc } from '../../categorie-alerte-bngrc/entities/categorie-alerte-bngrc.entity';
import { Sirene } from '@/sirene/entities/sirene.entity';
import { User }                 from '@/users/entities/user.entity';

export enum AudioBngrcStatus {
    PENDING  = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

@Entity('audio_alerte_bngrc')
export class AudioAlerteBngrc {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 45, nullable: true })
    name: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description: string | null;

    @Index({ unique: true })
    @Column({ name: 'mobile_id', type: 'varchar', length: 100 })
    mobileId: string;

    @Column({ type: 'varchar', length: 255 })
    audio: string; // chemin serveur ex: uploads/audios-bngrc/xxx.mp3

    @Column({ name: 'original_filename', type: 'varchar', length: 255, nullable: true })
    originalFilename: string | null;

    @Column({ name: 'file_size', type: 'int', nullable: true })
    fileSize: number | null;

    @Column({ name: 'duration', type: 'float', nullable: true })
    duration: number | null;

    @Column({ name: 'categorie_alerte_bngrc_id' })
    categorieAlerteBngrcId: number;

    @ManyToOne(() => CategorieAlerteBngrc, (c) => c.audios, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'categorie_alerte_bngrc_id' })
    categorie: CategorieAlerteBngrc;

    // ManyToMany avec Sirene — même pattern que AlerteAudio existant
    // Table pivot : audio_bngrc_sirene
    @ManyToMany(() => Sirene, { eager: true, onDelete: 'CASCADE' })
    @JoinTable({
        name:              'audio_bngrc_sirene',
        joinColumn:        { name: 'audio_bngrc_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'sirene_id',       referencedColumnName: 'id' },
    })
    sirenes: Sirene[];

    @Column({
        type:    'enum',
        enum:    AudioBngrcStatus,
        default: AudioBngrcStatus.PENDING,
    })
    status: AudioBngrcStatus;

    @Column({ type: 'text', name: 'rejection_comment', nullable: true })
    rejectionComment: string | null;

    @Column({ name: 'created_by_user_id', type: 'int', nullable: true })
    createdByUserId: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by_user_id' })
    createdByUser: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt?: Date;
}
