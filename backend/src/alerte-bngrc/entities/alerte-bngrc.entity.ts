import { TypeAlerteBngrc } from "src/type-alerte-bngrc/entities/type-alerte-bngrc.entity";
import { Entity, PrimaryGeneratedColumn,OneToMany, Column } from "typeorm";


@Entity("alerte_bngrc")
export class AlerteBngrc {

  @PrimaryGeneratedColumn() id: number;
  
  @Column() name: string;

  @OneToMany(() => TypeAlerteBngrc, t => t.alerte)
  types: TypeAlerteBngrc[];
}

