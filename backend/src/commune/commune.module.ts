import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Commune } from './entities/commune.entity';
import { CommunesService } from './commune.service';
import { CommunesController } from './commune.controller';
import { District } from '@/districts/entities/district.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Commune, District])],
  controllers: [CommunesController],
  providers: [CommunesService],
  exports: [CommunesService, TypeOrmModule],
})
export class CommuneModule {}