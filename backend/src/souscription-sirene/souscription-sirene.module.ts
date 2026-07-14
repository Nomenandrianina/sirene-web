import { Module } from '@nestjs/common';
import { SouscriptionSireneService } from './souscription-sirene.service';
import { SouscriptionSireneController } from './souscription-sirene.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SouscriptionSirene } from './entities/souscription-sirene.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SouscriptionSirene])],
  controllers: [SouscriptionSireneController],
  providers: [SouscriptionSireneService],
  exports: [SouscriptionSireneService],
})
export class SouscriptionSireneModule {}
