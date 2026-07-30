import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn,} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

/**
 * Représente un refresh token émis pour un utilisateur.
 * On ne stocke jamais le token brut, uniquement son hash SHA-256,
 * pour qu'une fuite de la base ne permette pas de réutiliser les tokens.
 */
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  token_hash: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  revoked_at: Date | null;

  @CreateDateColumn()
  created_at: Date;
}