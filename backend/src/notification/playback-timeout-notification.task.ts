// notification/playback-timeout-notification.task.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus, PlaybackAckStatus } from './entities/notification.entity';

@Injectable()
export class PlaybackTimeoutNotificationTask {
  private readonly logger = new Logger(PlaybackTimeoutNotificationTask.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
  ) {}

  // @Cron(CronExpression.EVERY_5_MINUTES)
  // async checkStalePlaybacks(): Promise<void> {
  //   const now = Date.now();

  //   // Cas A : lecture jamais démarrée, alors que l'heure planifiée est dépassée depuis longtemps
  //   const neverStarted = await this.notifRepo
  //     .createQueryBuilder('n')
  //     .where('n.status = :sent', { sent: NotificationStatus.SENT })
  //     .andWhere('n.playbackStatus IS NULL OR n.playbackStatus = :received', { received: PlaybackAckStatus.RECEIVED })
  //     .andWhere('n.sendingTimeAfterAlerte IS NOT NULL')
  //     .andWhere('n.sendingTimeAfterAlerte < :cutoff', { cutoff: new Date(now - 15 * 60_000) }) // 15 min de marge
  //     .getMany();

  //   for (const n of neverStarted) {
  //     await this.notifRepo.update(n.id, {
  //       playbackStatus: PlaybackAckStatus.TIMEOUT,
  //       playbackError:  'Lecture jamais démarrée à l\'heure planifiée',
  //     });
  //   }

  //   // Cas B : lecture démarrée mais jamais terminée
  //   const stuckPlaying = await this.notifRepo
  //     .createQueryBuilder('n')
  //     .leftJoinAndSelect('n.alerteAudio', 'a')
  //     .where('n.playbackStatus = :playing', { playing: PlaybackAckStatus.PLAYING })
  //     .getMany();

  //   for (const n of stuckPlaying) {
  //     const expectedMs = ((n.alerteAudio?.duration ?? 30) + 15) * 1000;
  //     const startedAt  = n.playbackStartedAt?.getTime() ?? 0;

  //     if (now - startedAt > expectedMs) {
  //       await this.notifRepo.update(n.id, {
  //         playbackStatus:  PlaybackAckStatus.TIMEOUT,
  //         playbackEndedAt: new Date(),
  //         playbackError:   'Lecture interrompue — aucune confirmation de fin reçue',
  //       });
  //     }
  //   }
  // }
}