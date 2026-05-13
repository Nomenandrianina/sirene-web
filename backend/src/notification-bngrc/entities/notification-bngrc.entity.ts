import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, } from 'typeorm';
import { Sirene }               from '@/sirene/entities/sirene.entity';
import { User }                 from '@/users/entities/user.entity';
import { AudioAlerteBngrc }     from '@/audio-alerte-bngrc/entities/audio-alerte-bngrc.entity';
import { CategorieAlerteBngrc } from '@/categorie-alerte-bngrc/entities/categorie-alerte-bngrc.entity';

export enum NotificationBngrcStatus {
    SENT     = 'sent',
    UNKNOWN  = 'unknown',
    FAILED   = 'failed',
    PENDING  = 'pending',
    DELIVERY = 'delivery',
}
  
export enum OrangeBngrcStatus {
    DELIVERED_TO_NETWORK  = 'DeliveredToNetwork',
    DELIVERY_UNCERTAIN    = 'DeliveryUncertain',
    DELIVERY_IMPOSSIBLE   = 'DeliveryImpossible',
    MESSAGE_WAITING       = 'MessageWaiting',
    DELIVERED_TO_TERMINAL = 'DeliveredToTerminal',
}

@Entity('notification_sirene_alerte_bngrc')
export class NotificationBngrc {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'message_id', type: 'varchar', length: 255, nullable: true })
    messageId: string | null;

    // type = "BNGRC — <nom catégorie>" pour faciliter l'affichage dans la liste notifications
    @Column({ type: 'varchar', length: 100, nullable: true })
    type: string | null;

    @Column({ type: 'varchar', length: 45, nullable: true })
    operator: string | null;

    @Column({ type: 'enum', enum: NotificationBngrcStatus, nullable: true })
    status: NotificationBngrcStatus | null;

    @Column({ type: 'text' })
    message: string;

    @Column({ name: 'sending_time', type: 'datetime', nullable: true })
    sendingTime: Date | null;

    @Column({ name: 'operator_status', type: 'varchar', length: 45, nullable: true })
    operatorStatus: string | null;

    @Column({ name: 'phone_number', type: 'varchar', length: 45, nullable: true })
    phoneNumber: string | null;

    // ── Lien sirène ────────────────────────────────────────────────────────────
    @Column({ name: 'sirene_id' })
    sireneId: number;

    @ManyToOne(() => Sirene, { nullable: true, onDelete: 'NO ACTION' })
    @JoinColumn({ name: 'sirene_id' })
    sirene: Sirene;

    // ── Lien audio BNGRC (remplace alerteAudioId de l'existant) ───────────────
    @Column({ name: 'audio_bngrc_id', type: 'int', nullable: true })
    audioBngrcId: number | null;

    @ManyToOne(() => AudioAlerteBngrc, { nullable: true, onDelete: 'NO ACTION' })
    @JoinColumn({ name: 'audio_bngrc_id' })
    audioBngrc: AudioAlerteBngrc;

    // ── Lien catégorie BNGRC (remplace sousCategorieAlerteId de l'existant) ────
    @Column({ name: 'categorie_alerte_bngrc_id', type: 'int', nullable: true })
    categorieAlerteBngrcId: number | null;

    @ManyToOne(() => CategorieAlerteBngrc, { nullable: true, onDelete: 'NO ACTION' })
    @JoinColumn({ name: 'categorie_alerte_bngrc_id' })
    categorieAlerteBngrc: CategorieAlerteBngrc;

    // ── Utilisateur qui a déclenché la diffusion ───────────────────────────────
    @Column({ name: 'user_id', type: 'int', nullable: true })
    userId: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'NO ACTION' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    // ── Statut opérateur Orange ────────────────────────────────────────────────
    @Column({ name: 'orange_status', type: 'enum', enum: OrangeBngrcStatus, nullable: true })
    orangeStatus: OrangeBngrcStatus | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    observation: string | null;

    // Heure d'envoi planifiée (null = envoi immédiat)
    @Column({ name: 'sending_time_after_alerte', type: 'datetime', nullable: true })
    sendingTimeAfterAlerte: Date | null;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
