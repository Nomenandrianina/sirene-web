import { AlerteAudio } from "@/alerte-audio/entities/alerte-audio.entity";
import { Sirene } from "@/sirene/entities/sirene.entity";
import { SousCategorieAlerte } from "@/sous-categorie-alerte/entities/sous-categorie-alerte.entity";
import { User } from "@/users/entities/user.entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";

export enum NotificationStatus {
  SENT     = "sent",
  UNKNOWN  = "unknown",
  FAILED   = "failed",
  PENDING  = "pending",
  DELIVERY = "delivery",
}

export enum OrangeStatus {
  DELIVERED_TO_NETWORK   = "DeliveredToNetwork",
  DELIVERY_UNCERTAIN     = "DeliveryUncertain",
  DELIVERY_IMPOSSIBLE    = "DeliveryImpossible",
  MESSAGE_WAITING        = "MessageWaiting",
  DELIVERED_TO_TERMINAL  = "DeliveredToTerminal",
}

@Entity("notification_sirene_alerte")
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "message_id", type: "varchar", length: 255, nullable: true })
  messageId: string | null;

  @Column({ type: "varchar", length: 45, nullable: true })
  type: string | null;

  @Column({ type: "varchar", length: 45, nullable: true })
  operator: string | null;

  @Column({ type: "enum", enum: NotificationStatus, nullable: true })
  status: NotificationStatus | null;

  @Column({ type: "text" })
  message: string;

  @Column({ name: "sending_time", type: "datetime", nullable: true })
  sendingTime: Date | null;

  @Column({ name: "operator_status", type: "varchar", length: 45, nullable: true })
  operatorStatus: string | null;

  @Column({ name: "phone_number", type: "varchar", length: 45, nullable: true })
  phoneNumber: string | null;

  @Column({ name: "weather_id", type: "int", nullable: true })
  weatherId: number | null;

  @Column({ name: "alerte_audio_id", type: "int", nullable: true })
  alerteAudioId: number | null;

  @ManyToOne(() => AlerteAudio, { nullable: true, onDelete: "NO ACTION" })
  @JoinColumn({ name: "alerte_audio_id" })
  alerteAudio: AlerteAudio;

  @Column({ name: "sirene_id" })
  sireneId: number;

  @ManyToOne(() => Sirene, { nullable: true, onDelete: "NO ACTION" })
  @JoinColumn({ name: "sirene_id" })
  sirene: Sirene;

  @Column({ name: "sous_categorie_alerte_id" })
  sousCategorieAlerteId: number;

  @ManyToOne(() => SousCategorieAlerte, { nullable: true, onDelete: "NO ACTION" })
  @JoinColumn({ name: "sous_categorie_alerte_id" })
  sousCategorie: SousCategorieAlerte;

  @Column({ name: "orange_status", type: "enum", enum: OrangeStatus, nullable: true })
  orangeStatus: OrangeStatus | null;

  @Column({ name: "user_id", type: "int", nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "NO ACTION" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "varchar", length: 255, nullable: true })
  observation: string | null;

  @Column({ name: "sending_time_after_alerte", type: "datetime", nullable: true })
  sendingTimeAfterAlerte: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}