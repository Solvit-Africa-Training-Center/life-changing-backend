// src/modules/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { SMSService } from './sms.service';
import { Notif } from '../entities/notification.entity';
import { NotificationType, NotificationStatus, NotificationChannel, Language } from '../../../config/constants';

@Injectable()
export class NotificationService {
  constructor(
    private configService: ConfigService,
    private africasTalkingService: SMSService,
    @InjectRepository(Notif)
    private notificationsRepository: Repository<Notif>,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: { en: string; rw: string },
    message: { en: string; rw: string },
    channel: NotificationChannel = NotificationChannel.IN_APP,
    data?: Record<string, any>,
    scheduledFor?: Date,
  ): Promise<Notif> {
    const notification = this.notificationsRepository.create({
      user: { id: userId } as any,
      type,
      title,
      message,
      channel,
      data,
      scheduledFor,
      status: NotificationStatus.PENDING,
    });

    const savedNotification = await this.notificationsRepository.save(notification);
    
    // Queue processing for in-app notifications
    if (channel === NotificationChannel.IN_APP) {
      await this.queueNotification(savedNotification);
    }
    
    return savedNotification;
  }

  private async queueNotification(notification: Notif): Promise<void> {
    const jobData = {
      notificationId: notification.id,
      userId: notification.user.id,
      type: notification.type,
      data: notification.data,
    };

    let jobName = 'generic-notification';
    
    // Map notification types to specific job handlers
    switch (notification.type) {
      case NotificationType.WELCOME:
        jobName = 'welcome-notification';
        break;
      case NotificationType.PASSWORD_RESET:
        jobName = 'password-reset-notification';
        break;
      // Add more mappings as needed
    }

    await this.notificationsQueue.add(jobName, jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    await this.notificationsQueue.add('email-verification', {
      email,
      token,
      timestamp: new Date().toISOString(),
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }

  async sendSMSVerification(phone: string, token: string): Promise<void> {
    await this.notificationsQueue.add('sms-verification', {
      phone,
      token,
      timestamp: new Date().toISOString(),
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    await this.notificationsQueue.add('password-reset-email', {
      email,
      token,
      timestamp: new Date().toISOString(),
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }

  async sendPasswordResetSMS(phone: string, token: string): Promise<void> {
    await this.notificationsQueue.add('password-reset-sms', {
      phone,
      token,
      timestamp: new Date().toISOString(),
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }

  async sendWelcomeNotification(userId: string, userType: string, language: Language = Language.EN): Promise<Notif> {
    const title = {
      en: 'Welcome to LCEO!',
      rw: 'Murakaza neza LCEO!',
    };

    const message = {
      en: `Thank you for joining LCEO as a ${userType}. We're excited to have you on board!`,
      rw: `Murakoze kwiyandikisha mu LCEO nk'${userType}. Turabashimiye kuba hamwe natwe!`,
    };

    return await this.createNotification(
      userId,
      NotificationType.WELCOME,
      title,
      message,
      NotificationChannel.IN_APP,
      { userType, language },
    );
  }

  async sendPasswordResetNotification(userId: string, language: Language = Language.EN): Promise<Notif> {
    const title = {
      en: 'Password Reset Requested',
      rw: 'Gusubiza ijambobanga Byasabye',
    };

    const message = {
      en: 'A password reset has been requested for your account. If this was not you, please contact support.',
      rw: 'Gusubiza ijambobanga byasabywe kuri konte yawe. Ibi niba atari wowe, mwakire inkunga.',
    };

    return await this.createNotification(
      userId,
      NotificationType.PASSWORD_RESET,
      title,
      message,
      NotificationChannel.IN_APP,
      { language },
    );
  }

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

  async getUserNotifications(userId: string): Promise<Notif[]> {
    return await this.notificationsRepository.find({
      where: { user: { id: userId } },
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
}