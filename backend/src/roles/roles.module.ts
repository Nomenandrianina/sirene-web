import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { PermissionsService } from 'src/permissions/permissions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role]),PermissionsModule],
  controllers: [RolesController],
  providers: [RolesService,PermissionsService],
  exports: [RolesService, TypeOrmModule],

})
export class RolesModule {}
