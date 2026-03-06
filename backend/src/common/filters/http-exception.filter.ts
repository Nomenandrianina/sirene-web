import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // Passport écrase le message avec "Unauthorized"
    // On récupère le code depuis la cause originale
    const code =
      exceptionResponse?.code ||
      exceptionResponse?.message?.code ||
      (typeof exceptionResponse?.message === 'string' && exceptionResponse.message !== 'Unauthorized'
        ? exceptionResponse.message
        : null) ||
      exception.cause?.['code'] ||  // ← cause de l'exception originale
      (status === 401 && request.path === '/auth/login' ? 'INVALID_CREDENTIALS' : 'UNKNOWN_ERROR');

    response.status(status).json({
      statusCode: status,
      code,
    });
  }
}