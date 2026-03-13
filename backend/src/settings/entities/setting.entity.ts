import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true, comment: 'Entity phone number' })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true, comment: 'Entity email address' })
  email: string | null;

  @Column({ type: 'varchar', nullable: true, comment: 'Physical address of the entity' })
  adresse: string | null;

  @Column({ type: 'decimal', default: 20, comment: 'Entity VAT number' })
  tva: number;

  @Column({ type: 'varchar', default: 'MGA', comment: 'Default currency used by the entity' })
  currency: string;

  @Column({ type: 'varchar', default: '3' })
  max_focal_point: string;

  @Column({ type: 'int', default: 3, comment: 'Number of days of subscription extension after subscription ended' })
  subscription_extension_days: number;

  @Column({ type: 'varchar', unique: true, default: 'Madagascar', comment: 'The name of the country' })
  country: string;

  // ── Labels Province ──
  @Column({ type: 'varchar', default: 'Provinces', comment: 'Plural label of the province' })
  province_labels: string;

  @Column({ type: 'varchar', default: 'Province', comment: 'Singular label of the province' })
  province_label: string;

  // ── Labels Région ──
  @Column({ type: 'varchar', default: 'Régions', comment: 'Plural label for the region' })
  region_labels: string;

  @Column({ type: 'varchar', default: 'Région', comment: 'Singular label for the region' })
  region_label: string;

  // ── Labels Village ──
  @Column({ type: 'varchar', default: 'Villages', comment: 'Plural label for the village' })
  village_labels: string;

  @Column({ type: 'varchar', default: 'Village', comment: 'Singular label for the village' })
  village_label: string;

  // ── Labels District ──
  @Column({ type: 'varchar', default: 'Districts', comment: 'Plural label for the district' })
  district_labels: string;

  @Column({ type: 'varchar', default: 'District', comment: 'Singular label for the district' })
  district_label: string;

  @Column({ type: 'varchar', default: '3', comment: 'Notification sending time' })
  notification_sending_time: string;

  // ── Champ utilisé dans WindguruService::getCodeColor() ──
  // Setting::first(['gust_alert']) dans le PHP
  @Column({ type: 'decimal', nullable: true, comment: 'Gust threshold to trigger max alert' })
  gust_alert: number | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}