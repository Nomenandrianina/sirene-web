import { Module } from '@nestjs/common';
import { CommandModule } from 'nestjs-command';
import { DiffusionCommand } from './diffusion.command';

import { DiffusionSchedulerModule } from '@/diffusion-scheduler/diffusion-scheduler.module';

@Module({
  imports: [
    CommandModule,
    DiffusionSchedulerModule, // 👈 IMPORTANT
  ],
  providers: [DiffusionCommand ],
})
export class AppCommandModule {}