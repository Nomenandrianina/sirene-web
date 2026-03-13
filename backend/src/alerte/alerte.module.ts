import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Alerte } from "./entities/alerte.entity";
import { Customer } from "../customers/entity/customer.entity";
import { AlerteService } from "./alerte.service";
import { AlerteController } from "./alerte.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Alerte, Customer])],
  controllers: [AlerteController],
  providers: [AlerteService],
  exports: [AlerteService],
})
export class AlerteModule {}