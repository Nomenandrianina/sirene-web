import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationBngrc, NotificationBngrcStatus } from '@/notification-bngrc/entities/notification-bngrc.entity';
import { PlaybackAckStatus } from '@/notification-bngrc/entities/notification-bngrc.entity'; // ou son propre fichier enum

@Injectable()
export class PlaybackTimeoutTask {
  private readonly logger = new Logger(PlaybackTimeoutTask.name);

  constructor(
    @InjectRepository(NotificationBngrc)
    private readonly notifRepo: Repository<NotificationBngrc>,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkStalePlaybacks(): Promise<void> {
    await this.timeoutNeverStarted();
    await this.timeoutStuckPlaying();
  }

  private async timeoutNeverStarted(): Promise<void> {
    const cutoff = new Date(Date.now() - 10 * 60_000); // 10 min

    const stale = await this.notifRepo
      .createQueryBuilder('n')
      .where('n.status = :sent', { sent: NotificationBngrcStatus.SENT })
      .andWhere('n.playbackStatus IS NULL')
      .andWhere('n.sendingTime < :cutoff', { cutoff })
      .getMany();

    for (const n of stale) {
      await this.notifRepo.update(n.id, {
        playbackStatus: PlaybackAckStatus.TIMEOUT,
        playbackError:  'Aucune confirmation reçue (sirène injoignable)',
      });
    }

    if (stale.length) {
      this.logger.warn(`[Playback] ${stale.length} notif(s) jamais confirmée(s) → timeout`);
    }
  }

  private async timeoutStuckPlaying(): Promise<void> {
    const stuck = await this.notifRepo
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.audioBngrc', 'a')
      .where('n.playbackStatus = :playing', { playing: PlaybackAckStatus.PLAYING })
      .getMany();

    const now = Date.now();

    for (const n of stuck) {
      const expectedMs = ((n.audioBngrc?.duration ?? 30) + 15) * 1000;
      const startedAt  = n.playbackStartedAt?.getTime() ?? 0;

      if (now - startedAt > expectedMs) {
        await this.notifRepo.update(n.id, {
          playbackStatus:  PlaybackAckStatus.TIMEOUT,
          playbackEndedAt: new Date(),
          playbackError:   'Lecture interrompue — aucune confirmation de fin reçue',
        });
        this.logger.warn(`[Playback] Notif #${n.id} bloquée en "playing" → timeout`);
      }
    }
  }
}