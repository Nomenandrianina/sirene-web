import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
    ManyToOne, JoinColumn,
  } from 'typeorm';
  import { Flow } from 'src/flows/entities/flow.entity';
  import { Village } from 'src/villages/entities/village.entity'; 
  
  @Entity('weathers')
  export class Weather {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ name: 'flow_id' })
    flow_id: number;
  
    @Column({ name: 'village_id' })
    village_id: number;
  
    @Column({ type: 'longtext', nullable: true })
    gfs: object;
  
    @Column({ type: 'json', nullable: true })
    icon: object;
  
    @Column({ type: 'json', nullable: true })
    gfs_wave: object;
  
    @Column({ type: 'json', nullable: true })
    arome: object;
  
    @Column({ type: 'json' })
    original_weather: object;
  
    @Column({ type: 'json' })
    final_weather: FinalWeatherEntry[];
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  
    @DeleteDateColumn()
    deleted_at: Date;
  
    // Relations
    @ManyToOne(() => Flow, (flow) => flow.weathers)
    @JoinColumn({ name: 'flow_id' })
    flow: Flow;
  
    @ManyToOne(() => Village, village => village.weathers, {
      onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'village_id' })
    village: Village;
  }
  
  // Type pour un élément de final_weather
  export interface FinalWeatherEntry {
    type: 'GUST' | 'WINDIRNAME' | 'WINDSPD' | 'WVHGT' | 'COLOR' | 'ALERT';
    date: string;       // "YYYY-MM-DD"
    day_part: 'AM' | 'PM';
    result: any;
  }