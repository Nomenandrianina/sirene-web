import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { initFirebase } from './config/firebase';


async function bootstrap() {
  initFirebase();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ✅ CORS restreint avec credentials
  app.enableCors({
    origin: [
      'https://sirene.manager.mitao-forecast.com',
      'http://localhost:5173',
      'http://localhost:8080',
    ],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  mkdirSync(join(process.cwd(), 'uploads', 'avatars'), { recursive: true });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/backend/uploads',
  });

  app.setGlobalPrefix('backend');
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();