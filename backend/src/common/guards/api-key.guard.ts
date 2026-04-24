import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const key = req.headers['x-api-key'];
    console.log('ApiKeyGuard - key reçue:', key);


    if (!key || key !== this.config.get<string>('FCM_API_KEY')) {
      throw new UnauthorizedException('API key invalide');
    }
    return true;
  }
}