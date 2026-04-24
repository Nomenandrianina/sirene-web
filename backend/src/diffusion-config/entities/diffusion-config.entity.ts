import { Entity, PrimaryGeneratedColumn, Column,UpdateDateColumn, CreateDateColumn, } from 'typeorm';
  
@Entity('diffusion_config')
export class DiffusionConfig {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ type: 'int', nullable: true, unique: true })
    regionId: number | null;
  
    /** Label lisible, ex: "Nord", "Sud", "Global" */
    @Column({ nullable: true })
    label: string;
  
    /** Heure d'envoi 0–23 */
    @Column({ type: 'int', default: 3 })
    sendHour: number;
  
    /** Minutes 0–59 */
    @Column({ type: 'int', default: 0 })
    sendMinute: number;
  
    @Column({ type: 'simple-array', nullable: true })
    sendDays: number[] | null;
  
    @Column({ default: true })
    isActive: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
}