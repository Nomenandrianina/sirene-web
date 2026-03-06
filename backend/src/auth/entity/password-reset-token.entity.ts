import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token_hash: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  created_at: Date;
}
