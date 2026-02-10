// src/modules/notifications/services/notification-status.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Notif } from '../entities/notification.entity';
import { NotificationStatus } from '../../../config/constants';

@Injectable()
export class NotificationStatusService {
  constructor(
    @InjectRepository(Notif)
    private notificationsRepository: Repository<Notif>,
  ) {}

  async markNotificationAsSent(notificationId: string, deliveryReport?: any): Promise<void> {
    await this.notificationsRepository.update(notificationId, {
      status: NotificationStatus.SENT,
      sentAt: new Date(),
      deliveryReport,
    });
  }

  async markNotificationAsDelivered(notificationId: string): Promise<void> {
    await this.notificationsRepository.update(notificationId, {
      status: NotificationStatus.DELIVERED,
      deliveredAt: new Date(),
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.notificationsRepository.update(notificationId, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    });
  }

  async markNotificationsAsReadByUser(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { user: { id: userId }, status: NotificationStatus.DELIVERED },
      { status: NotificationStatus.READ, readAt: new Date() }
    );
  }

  async getNotificationStatus(notificationId: string): Promise<{ status: NotificationStatus; sentAt?: Date; deliveredAt?: Date; readAt?: Date }> {
    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId },
      select: ['status', 'sentAt', 'deliveredAt', 'readAt']
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return {
      status: notification.status,
      sentAt: notification.sentAt,
      deliveredAt: notification.deliveredAt,
      readAt: notification.readAt,
    };
  }
}