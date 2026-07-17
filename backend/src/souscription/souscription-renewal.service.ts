// souscription/souscription-renewal.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Souscription, SouscriptionStatus } from './entities/souscription.entity';
import { SouscriptionSirene } from '@/souscription-sirene/entities/souscription-sirene.entity';
import { PackType } from '@/packtype/entities/packtype.entity';
import { calculateEndDate } from './utils/calculate-end-date.util';

@Injectable()
export class SouscriptionRenewalService {
  private readonly logger = new Logger(SouscriptionRenewalService.name);

  constructor(
    @InjectRepository(Souscription)      private repo: Repository<Souscription>,
    @InjectRepository(SouscriptionSirene) private ssRepo: Repository<SouscriptionSirene>,
    @InjectRepository(PackType)           private packRepo: Repository<PackType>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleRenewals() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expired = await this.repo.find({
      where: { status: SouscriptionStatus.ACTIVE, endDate: LessThanOrEqual(today) },
      relations: ['packType', 'souscriptionSirenes'],
    });

    this.logger.log(`${expired.length} souscription(s) arrivée(s) à échéance`);

    for (const s of expired) {
      try {
        await this.renewOne(s);
      } catch (err) {
        this.logger.error(`Échec renouvellement souscription #${s.id}`, err as Error);
      }
    }
  }

  private async renewOne(s: Souscription) {
    // Pas de renouvellement auto → on marque expirée et on s'arrête là
    if (!s.autoRenew) {
      s.status = SouscriptionStatus.EXPIRED;
      await this.repo.save(s);
      // TODO: notifier le client que sa souscription a expiré
      return;
    }

    const nextPackId = s.pendingPackTypeId ?? s.packTypeId;
    const nextPack = nextPackId === s.packTypeId
      ? s.packType
      : await this.packRepo.findOne({ where: { id: nextPackId, isActive: true } });

    if (!nextPack) {
      // Pack demandé introuvable/désactivé entretemps → fallback sur l'ancien pack
      this.logger.warn(`Pack #${nextPackId} introuvable pour souscription #${s.id}, on garde l'ancien pack`);
      await this.applyRenewal(s, s.packType);
      // TODO: notifier le client que sa demande de changement n'a pas pu être appliquée
      return;
    }

    const isUpgrade = nextPackId !== s.packTypeId;
    await this.applyRenewal(s, nextPack);
    if (isUpgrade) {
      // TODO: notifier le client que son nouveau pack est actif
    }
  }

  private async applyRenewal(s: Souscription, pack: PackType) {
    const newStart = new Date(s.endDate);
    newStart.setDate(newStart.getDate() + 1);
    const newEnd = calculateEndDate(newStart, pack);

    s.packTypeId        = pack.id;
    s.startDate          = newStart;
    s.endDate            = newEnd;
    s.pendingPackTypeId  = null;
    s.pendingRequestedAt = null;
    await this.repo.save(s);

    // Réinitialisation des crédits — CHAQUE sirène repart avec le plein quota du pack
    for (const ss of s.souscriptionSirenes) {
      ss.nombreCredits   = pack.nombreCredits ?? null;
      ss.creditsRestants = pack.nombreCredits ?? null;
      await this.ssRepo.save(ss);
    }
  }
}