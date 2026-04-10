import { Module } from '@nestjs/common';
import { PacktypeService } from './packtype.service';
import { PacktypeController } from './packtype.controller';
import { PackType } from './entities/packtype.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([PackType])],
  controllers: [PacktypeController],
  providers: [PacktypeService],
  exports: [PacktypeService],
})
export class PacktypeModule {}
