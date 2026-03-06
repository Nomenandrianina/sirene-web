import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';



@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}


  @Get()
  findAll(
    @Query('userId')  userId?:  string,
    @Query('entity')  entity?:  string,
    @Query('action')  action?:  string,
    @Query('from')    from?:    string,
    @Query('to')      to?:      string,
    @Query('page')    page  = '1',
    @Query('limit')   limit = '20',
  ) {
    return this.auditLogService.findAll({
      userId:  userId  ? +userId  : undefined,
      entity,
      action,
      from:    from  ? new Date(from)  : undefined,
      to:      to    ? new Date(to)    : undefined,
      page:    +page,
      limit:   +limit,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.auditLogService.findOne(id);
  }
}
