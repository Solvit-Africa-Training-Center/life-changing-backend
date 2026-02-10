// src/modules/notifications/services/in-app-notification.service.ts
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { NotificationFactoryService } from './notification-factory.service';
import { Notif } from '../entities/notification.entity';
import { NotificationType, NotificationChannel, Language } from '../../../config/constants';

@Injectable()
export class InAppNotificationService {
  constructor(
    @InjectQueue('notifications') private notificationsQueue: Queue,
    private notificationFactory: NotificationFactoryService,
  ) {}

  async sendWelcomeNotification(
    userId: string, 
    userType: string, 
    language: Language = Language.EN
  ): Promise<Notif> {
    const { title, message, data } = this.notificationFactory.createWelcomeNotificationData(userType, language);
    
    const notification = await this.notificationFactory.createNotification(
      userId,
      NotificationType.WELCOME,
      title,
      message,
      NotificationChannel.IN_APP,
      data,
    );

    await this.queueNotification(notification);
    return notification;
  }

  async sendPasswordResetNotification(
    userId: string, 
    language: Language = Language.EN
  ): Promise<Notif> {
    const { title, message, data } = this.notificationFactory.createPasswordResetNotificationData(language);
    
    const notification = await this.notificationFactory.createNotification(
      userId,
      NotificationType.PASSWORD_RESET,
      title,
      message,
      NotificationChannel.IN_APP,
      data,
    );

    await this.queueNotification(notification);
    return notification;
  }

  async sendAccountActivatedNotification(
    userId: string,
    language: Language = Language.EN
  ): Promise<Notif> {
    const { title, message, data } = this.notificationFactory.createAccountActivatedNotificationData(language);
    
    const notification = await this.notificationFactory.createNotification(
      userId,
      NotificationType.SYSTEM_ALERT,
      title,
      message,
      NotificationChannel.IN_APP,
      data,
    );

    await this.queueNotification(notification);
    return notification;
  }

  async sendAccountDeactivatedNotification(
    userId: string,
    language: Language = Language.EN,
    reason?: string
  ): Promise<Notif> {
    const title = {
      en: 'Account Deactivated',
      rw: 'Konte Yahagaritswe',
    };

    const message = {
      en: `Your account has been deactivated by the admin. ${reason ? `Reason: ${reason}` : ''}`,
      rw: `Konte yawe yahagaritswe n'umuyobozi. ${reason ? `Impamvu: ${reason}` : ''}`,
    };

    const notification = await this.notificationFactory.createNotification(
      userId,
      NotificationType.SYSTEM_ALERT,
      title,
      message,
      NotificationChannel.IN_APP,
      { language, type: 'account_deactivated', reason },
    );

    await this.queueNotification(notification);
    return notification;
  }

  async sendDonationReceiptNotification(
    userId: string,
    donationId: string,
    amount: number,
    currency: string,
    projectName: string,
    language: Language = Language.EN
  ): Promise<Notif> {
    const { title, message, data } = this.notificationFactory.createDonationReceiptNotificationData(
      amount, currency, projectName, language
    );
    
    const notification = await this.notificationFactory.createNotification(
      userId,
      NotificationType.DONATION_RECEIPT,
      title,
      message,
      NotificationChannel.IN_APP,
      { donationId, ...data },
    );

    await this.queueNotification(notification);
    return notification;
  }

  async sendRecurringDonationFailureNotification(
    userId: string,
    amount: number,
    currency: string,
    frequency: string,
    language: Language = Language.EN
  ): Promise<Notif> {
    const title = {
      en: 'Payment Processing Issue',
      rw: 'Ikibazo mu Kwishyura',
    };

    const message = {
      en: `We couldn't process your recurring ${frequency} donation of ${amount} ${currency}. Please update your payment information.`,
      rw: `Ntidushoboye gusohora donation yawe ya buri ${frequency} yoheje ${amount} ${currency}. Nyamuneka, hindura amakuru yawe yo kwishyura.`,
    };

    const notification = await this.notificationFactory.createNotification(
      userId,
      NotificationType.SYSTEM_ALERT,
      title,
      message,
      NotificationChannel.IN_APP,
      { amount, currency, frequency, language, type: 'recurring_donation_failed' },
    );

    await this.queueNotification(notification);
    return notification;
  }

   async queueNotification(notification: Notif): Promise<void> {
    const jobData = {
      notificationId: notification.id,
      userId: notification.user.id,
      type: notification.type,
      data: notification.data,
    };

    let jobName = 'generic-notification';

    switch (notification.type) {
      case NotificationType.WELCOME:
        jobName = 'welcome-notification';
        break;
      case NotificationType.PASSWORD_RESET:
        jobName = 'password-reset-notification';
        break;
      case NotificationType.DONATION_RECEIPT:
        jobName = 'donation-receipt-notification';
        break;
      case NotificationType.SYSTEM_ALERT:
        jobName = 'system-alert-notification';
        break;
    }

    await this.notificationsQueue.add(jobName, jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}