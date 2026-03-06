// src/audit-log/interceptors/audit-log.interceptor.ts
import {
  Injectable, NestInterceptor, ExecutionContext,
  CallHandler, Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AUDIT_KEY } from '../decorators/audit.decorator';
import { AuditLogService } from '../audit-log.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditLogService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const meta = this.reflector.get<{ action: string; entity: string }>(
      AUDIT_KEY, ctx.getHandler(),
    );

    if (!meta) return next.handle();

    const req   = ctx.switchToHttp().getRequest();
    const userId = req.user?.sub ?? req.user?.id;

    if (!userId) return next.handle();

    return next.handle().pipe(
      tap((result) => {
        const entityId = result?.id ?? req.params?.id ?? 0;
        this.auditService.log({
          userId:   +userId,
          action:   meta.action,
          entity:   meta.entity,
          entityId: +entityId,
        });
      }),
    );
  }
}