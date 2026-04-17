import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanningDiffusion, PlanningStatus } from 'src/planning-diffusion/entities/planning-diffusion.entity';
import { Souscription, SouscriptionStatus } from 'src/souscription/entities/souscription.entity';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class PlanningGeneratorService {
  constructor(
    @InjectRepository(Souscription)
    private readonly subRepo: Repository<Souscription>,

    @InjectRepository(PlanningDiffusion)
    private readonly planningRepo: Repository<PlanningDiffusion>,
  ) {}

  async generateForNextDays(days = 7) {
    const subs = await this.subRepo.find({
      where: { status: SouscriptionStatus.ACTIVE },
      relations: ['sirenes', 'packType'],
    });

    const now = new Date();

    for (const sub of subs) {
      const pack = sub.packType;

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(now.getDate() + i);

        const isoDay = date.getDay() === 0 ? 7 : date.getDay();

        // 🔹 Filtre jours
        if (pack.joursAutorises?.length) {
          if (!pack.joursAutorises.includes(isoDay)) continue;
        }

        for (const heure of [7, 12, 16]) {
          const slotIndex = heure === 7 ? 1 : heure === 12 ? 2 : 3;

          if (pack.frequenceParJour < slotIndex) continue;

          for (const sirene of sub.sirenes ?? []) {
            const scheduledAt = new Date(date);
            scheduledAt.setHours(heure, 0, 0, 0);

            // éviter doublons
            const exists = await this.planningRepo.findOne({
              where: {
                souscriptionId: sub.id,
                sireneId: sirene.id,
                scheduledAt,
              },
            });

            if (exists) continue;

            const planning = this.planningRepo.create({
              souscriptionId: sub.id,
              sireneId: sirene.id,
              scheduledAt,
              status: PlanningStatus.PLANNED,
            });

            await this.planningRepo.save(planning);
          }
        }
      }
    }
  }
}