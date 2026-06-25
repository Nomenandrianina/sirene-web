import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { initFirebase } from './config/firebase';


async function bootstrap() {
  initFirebase();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const appPrefix = process.env.APP_PREFIX ?? 'backend';

  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? '').split(','),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  mkdirSync(join(process.cwd(), 'uploads', 'avatars'), { recursive: true });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: `/${appPrefix}/uploads`,
  });

  app.setGlobalPrefix(appPrefix);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
