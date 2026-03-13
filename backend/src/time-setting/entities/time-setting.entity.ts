import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type TimePeriod = 'AM' | 'PM';

@Entity('time_settings')
export class TimeSetting {
  @PrimaryGeneratedColumn()
  id: number;

  // NULL = valeur par défaut (comme dans la logique PHP)
  @Column({ type: 'varchar', nullable: true })
  data_type: string | null;

  @Column({ type: 'varchar' })
  time_field: TimePeriod;

  @Column({ type: 'time' })
  start_time: string; // ex: "06:00:00"

  @Column({ type: 'time' })
  end_time: string;   // ex: "12:00:00"

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}