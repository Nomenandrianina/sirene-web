  import {
    Entity, PrimaryGeneratedColumn, Column,
    ManyToOne, ManyToMany, JoinTable, JoinColumn,
    CreateDateColumn, DeleteDateColumn,OneToMany
  } from 'typeorm';
  import { Village }  from 'src/villages/entities/village.entity';
  import { Customer } from 'src/customers/entity/customer.entity';
import { Notification } from '@/notification/entities/notification.entity';
  
  @Entity('sirene')
  export class Sirene {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ type: 'varchar', length: 45, nullable: true })
    name: string | null;

    @Column({ type: 'varchar', length: 45, nullable: true , unique: true })
    imei: string | null;
  
    @Column({ type: 'varchar', length: 45, nullable: true })
    latitude: string | null;
  
    @Column({ type: 'varchar', length: 45, nullable: true })
    longitude: string | null;
  
    @Column({ name: 'phone_number_brain', type: 'varchar', length: 45, nullable: true })
    phoneNumberBrain: string | null;
  
    @Column({ name: 'phone_number_relai', type: 'varchar', length: 45, nullable: true })
    phoneNumberRelai: string | null;
  
    @Column({ name: 'village_id' })
    villageId: number;
  
    @Column({ name: 'is_active', type: 'tinyint', default: 1 })
    isActive: number;
  
    @ManyToOne(() => Village, { onDelete: 'NO ACTION' })
    @JoinColumn({ name: 'village_id' })
    village: Village;
  
    @ManyToMany(() => Customer)
    @JoinTable({
      name:              'sirene_client',
      joinColumn:        { name: 'sirene_id',   referencedColumnName: 'id' },
      inverseJoinColumn: { name: 'customer_id', referencedColumnName: 'id' },
    })
    customers: Customer[];
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
    
    @DeleteDateColumn({ name: 'deleted_at', nullable: true })
    deletedAt: Date | null;


    @OneToMany(() => Notification, (notification) => notification.sirene)
    notifications: Notification[];

  }