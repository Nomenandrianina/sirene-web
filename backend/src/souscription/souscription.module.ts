import { Module } from '@nestjs/common';
import { SouscriptionService } from './souscription.service';
import { SouscriptionController } from './souscription.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Souscription } from './entities/souscription.entity';
import { PackType } from '@/packtype/entities/packtype.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Souscription,PackType])],
  controllers: [SouscriptionController],
  providers: [SouscriptionService],
  exports: [SouscriptionService],

})
export class SouscriptionModule {}
