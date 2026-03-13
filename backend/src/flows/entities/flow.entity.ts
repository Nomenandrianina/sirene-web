import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
    OneToMany,
  } from 'typeorm';
  import { Weather } from 'src/weathers/entities/weather.entity';
  
  export type FlowType = 'forecast' | 'alert';
  
  @Entity('flows')
  export class Flow {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ type: 'varchar', default: '' })
    reference: string;
  
    @Column({ type: 'datetime' })
    date: Date;
  
    @Column({ type: 'enum', enum: ['forecast', 'alert'] })
    type: FlowType;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  
    @DeleteDateColumn()
    deleted_at: Date;
  
    @OneToMany(() => Weather, (weather) => weather.flow)
    weathers: Weather[];
  }