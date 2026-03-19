import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import { mkdirSync } from 'fs';

async function bootstrap() {
  // NestExpressApplication pour pouvoir utiliser useStaticAssets
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({ origin: '*', allowedHeaders: ['Content-Type', 'Authorization'] });

  // Créer le dossier uploads/avatars automatiquement s'il n'existe pas
  mkdirSync(join(process.cwd(), 'uploads', 'avatars'), { recursive: true });

  // Servir les fichiers statiques — accessibles via /uploads/avatars/fichier.jpg
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/backend/uploads',
  });

  app.setGlobalPrefix('backend');
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();