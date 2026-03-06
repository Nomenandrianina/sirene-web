import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { AuditLog } from './entity/audit-log.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditLogService],
  controllers: [AuditLogController],
  exports: [AuditLogService, TypeOrmModule],
})
export class AuditLogModule {}
