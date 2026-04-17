// run-task.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DiffusionSchedulerService } from '@/diffusion-scheduler/diffusion-scheduler.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const service = app.get(DiffusionSchedulerService);

  // await service.processCreneau(7); // 👈 ta fonction

  await app.close();
}

bootstrap();