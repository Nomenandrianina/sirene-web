import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('alert_levels')
export class AlertLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', comment: 'Level of the alert' })
  level: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: 'Minimum wind speed for the condition' })
  windspd_min: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: 'Maximum wind speed for the condition' })
  windspd_max: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: 'Minimum wave for the condition' })
  wave_min: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true, comment: 'Maximum wave for the condition' })
  wave_max: number | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}