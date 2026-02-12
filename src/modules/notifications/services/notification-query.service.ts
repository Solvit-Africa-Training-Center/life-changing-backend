// src/modules/notifications/services/notification-query.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Notif } from '../entities/notification.entity';
import { NotificationStatus, NotificationType } from '../../../config/constants';

@Injectable()
export class NotificationQueryService {
  constructor(
    @InjectRepository(Notif)
    private notificationsRepository: Repository<Notif>,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  async getUserNotifications(userId: string): Promise<Notif[]> {
    return await this.notificationsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserUnreadNotifications(userId: string): Promise<Notif[]> {
    return await this.notificationsRepository.find({
      where: { 
        user: { id: userId },
        status: NotificationStatus.DELIVERED,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getNotificationById(notificationId: string): Promise<Notif | null> {
    return await this.notificationsRepository.findOne({
      where: { id: notificationId },
      relations: ['user'],
    });
  }

  async getNotificationsByType(userId: string, type: NotificationType): Promise<Notif[]> {
    return await this.notificationsRepository.find({
      where: { 
        user: { id: userId },
        type,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getQueueStats(): Promise<any> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.notificationsQueue.getWaitingCount(),
      this.notificationsQueue.getActiveCount(),
      this.notificationsQueue.getCompletedCount(),
      this.notificationsQueue.getFailedCount(),
      this.notificationsQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  async retryFailedJobs(): Promise<void> {
    const failedJobs = await this.notificationsQueue.getFailed();
    for (const job of failedJobs) {
      await job.retry();
    }
  }

  async clearCompletedJobs(): Promise<void> {
    await this.notificationsQueue.clean(0, 'completed');
  }
}