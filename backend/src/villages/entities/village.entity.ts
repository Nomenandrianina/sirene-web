// src/permissions/permission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne,JoinColumn,OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entity/base.entity';
import { Province } from 'src/provinces/entities/province.entity';
import { Region } from 'src/regions/entities/region.entity';
import { District } from 'src/districts/entities/district.entity';
import { Weather } from 'src/weathers/entities/weather.entity';


@Entity('villages')
export class Village extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  latitude: string;
  
  @Column()
  longitude: string;

  @ManyToOne(() => Province, { eager: true})
  @JoinColumn()
  province: Province;
 
  @ManyToOne(() => Region, { eager: true})
  @JoinColumn()
  region: Region;

  @ManyToOne(() => District, { eager: true})
  @JoinColumn()
  district: District;

  @OneToMany(() => Weather, weather => weather.village)
  weathers: Weather[];  

}
