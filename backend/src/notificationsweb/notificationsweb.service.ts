import { Injectable } from '@nestjs/common';
import { CreateNotificationswebDto } from './dto/create-notificationsweb.dto';
import { UpdateNotificationswebDto } from './dto/update-notificationsweb.dto';
import { Notificationsweb } from './entities/notificationsweb.entity';
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class NotificationswebService {

  constructor(
    @InjectRepository(Notificationsweb)
    private readonly repo: Repository<Notificationsweb>,
  ) {}

  /** Crée une notif pour un seul user */
  async notify(userId: number, payload: {
    type:        string;
    message:     string;
    entityType?: string;
    entityId?:   number;
    url?:        string;
  }) {
    return this.repo.save(this.repo.create({ userId, ...payload }));
  }

  /** Crée la même notif pour plusieurs users d'un coup */
  async notifyMany(userIds: number[], payload: Parameters<this['notify']>[1]) {
    const entities = userIds.map(uid => this.repo.create({ userId: uid, ...payload }));
    return this.repo.save(entities);
  }

  /** Récupère les notifs non lues d'un user */
  async getUnread(userId: number) {
    return this.repo.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  /** Marque une notif comme lue */
  async markRead(id: number, userId: number) {
    await this.repo.update({ id, userId }, { isRead: true });
  }

  /** Marque toutes les notifs d'un user comme lues */
  async markAllRead(userId: number) {
    return this.repo.update({ userId, isRead: false }, { isRead: true });
  }

  getAll(userId: number) {
    return this.repo.find({
      where:  { userId },              
      order:  { createdAt: 'DESC' },
      take:   50,
    });
  }

  create(createNotificationswebDto: CreateNotificationswebDto) {
    return 'This action adds a new notificationsweb';
  }

  findAll() {
    return `This action returns all notificationsweb`;
  }

  findOne(id: number) {
    return `This action returns a #${id} notificationsweb`;
  }

  update(id: number, updateNotificationswebDto: UpdateNotificationswebDto) {
    return `This action updates a #${id} notificationsweb`;
  }

  remove(id: number) {
    return `This action removes a #${id} notificationsweb`;
  }
}
