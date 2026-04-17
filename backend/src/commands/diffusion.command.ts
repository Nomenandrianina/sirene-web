import { Injectable } from '@nestjs/common';
import { Command } from 'nestjs-command';
import { DiffusionSchedulerService } from '@/diffusion-scheduler/diffusion-scheduler.service';

@Injectable()
export class DiffusionCommand {
  constructor(
    private readonly diffusionScheduler: DiffusionSchedulerService,
  ) {}

  @Command({
    command: 'diffusion:creneau <heure>',
    describe: 'Lancer la diffusion pour un créneau (7, 12, 16)',
  })
  async run(heure: string) {
    const h = Number(heure);    

    console.log(`🚀 Lancement diffusion ${h}h`);

    // await this.diffusionScheduler.processCreneau(7);


    console.log(`✅ Terminé`);
  }
}