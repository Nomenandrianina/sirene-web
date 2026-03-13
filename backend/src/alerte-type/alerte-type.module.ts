import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AlerteType } from "@/alerte-type/entities/alerte-type.entity";
import { AlerteTypeService } from "./alerte-type.service";
import { AlerteTypeController } from "./alerte-type.controller";

@Module({
  imports: [TypeOrmModule.forFeature([AlerteType])],
  controllers: [AlerteTypeController],
  providers: [AlerteTypeService],
  exports: [AlerteTypeService],
})
export class AlerteTypeModule {}