// src/modules/notifications/services/notifications.service.ts
import { Injectable } from '@nestjs/common';

import { Notif } from '../entities/notification.entity';
import { NotificationType, NotificationChannel, Language } from '../../../config/constants';
import { DonationReceiptData } from '../../donations/interfaces/donation-receipt.interface';

import { NotificationFactoryService } from './notification-factory.service';
import { EmailNotificationService } from './email-notification.service';
import { SMSNotificationService } from './sms-notification.service';
import { InAppNotificationService } from './in-app-notification.service';
import { NotificationStatusService } from './notification-status.service';
import { NotificationQueryService } from './notification-query.service';



@Injectable()
export class NotificationService {
  constructor(
    private notificationFactory: NotificationFactoryService,
    private emailNotificationService: EmailNotificationService,
    private smsNotificationService: SMSNotificationService,
    private inAppNotificationService: InAppNotificationService,
    private notificationStatusService: NotificationStatusService,
    private notificationQueryService: NotificationQueryService,
  ) { }

  async createNotification(
    userId: string,
    type: NotificationType,
    title: { en: string; rw: string },
    message: { en: string; rw: string },
    channel: NotificationChannel = NotificationChannel.IN_APP,
    data?: Record<string, any>,
    scheduledFor?: Date,
  ): Promise<Notif> {
    const notification = await this.notificationFactory.createNotification(
      userId,
      type,
      title,
      message,
      channel,
      data,
      scheduledFor,
    );

    if (channel === NotificationChannel.IN_APP) {
      await this.inAppNotificationService.queueNotification(notification);
    }

    return notification;
  }

  // Email-related notification methods
  async sendEmailVerification(email: string, token: string): Promise<void> {
    return this.emailNotificationService.sendEmailVerification(email, token);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    return this.emailNotificationService.sendPasswordResetEmail(email, token);
  }

  async sendDonationReceiptEmail(email: string, receiptData: DonationReceiptData): Promise<void> {
    return this.emailNotificationService.sendDonationReceiptEmail(email, receiptData);
  }

  async sendRecurringDonationFailedEmail(
    email: string,
    donorName: string,
    amount: number,
    currency: string,
    frequency: string,
    language: Language = Language.EN
  ): Promise<void> {
    return this.emailNotificationService.sendRecurringDonationFailedEmail(
      email,
      donorName,
      amount,
      currency,
      frequency,
      language
    );
  }

  // SMS-related notification methods
  async sendSMSVerification(phone: string, token: string): Promise<void> {
    return this.smsNotificationService.sendSMSVerification(phone, token);
  }

  async sendPasswordResetSMS(phone: string, token: string): Promise<void> {
    return this.smsNotificationService.sendPasswordResetSMS(phone, token);
  }

  async sendDonationReceiptSMS(phone: string, message: string): Promise<void> {
    return this.smsNotificationService.sendDonationReceiptSMS(phone, message);
  }

  // Pre-defined notification templates
  async sendWelcomeNotification(userId: string, userType: string, language: Language = Language.EN): Promise<Notif> {
    return this.inAppNotificationService.sendWelcomeNotification(userId, userType, language);
  }

  async sendPasswordResetNotification(userId: string, language: Language = Language.EN): Promise<Notif> {
    return this.inAppNotificationService.sendPasswordResetNotification(userId, language);
  }

  async sendAccountActivatedNotification(
    userId: string,
    language: Language = Language.EN
  ): Promise<Notif> {
    return this.inAppNotificationService.sendAccountActivatedNotification(userId, language);

  }

  async sendAccountDeactivatedNotification(
    userId: string,
    language: Language = Language.EN,
    reason?: string
  ): Promise<Notif> {
    return this.inAppNotificationService.sendAccountDeactivatedNotification(userId, language, reason);

  }

  async sendDonationReceiptNotification(
    userId: string,
    donationId: string,
    amount: number,
    currency: string,
    projectName: string,
    language: Language = Language.EN
  ): Promise<Notif> {
    return this.inAppNotificationService.sendDonationReceiptNotification(
      userId,
      donationId,
      amount,
      currency,
      projectName,
      language
    );
  }

  async sendRecurringDonationFailureNotification(
    userId: string,
    amount: number,
    currency: string,
    frequency: string,
    language: Language = Language.EN
  ): Promise<Notif> {
    return this.inAppNotificationService.sendRecurringDonationFailureNotification(
      userId,
      amount,
      currency,
      frequency,
      language
    );
  }

  // Notification status management
  async markNotificationAsSent(notificationId: string, deliveryReport?: any): Promise<void> {
    return this.notificationStatusService.markNotificationAsSent(notificationId, deliveryReport);

  }

  async markNotificationAsDelivered(notificationId: string): Promise<void> {
    return this.notificationStatusService.markNotificationAsDelivered(notificationId);

  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    return this.notificationStatusService.markNotificationAsRead(notificationId);

  }

  // Notification retrieval
  async getUserNotifications(userId: string): Promise<Notif[]> {
    return this.notificationQueryService.getUserNotifications(userId);
  }

  // Queue management
  async getQueueStats(): Promise<any> {
    return this.notificationQueryService.getQueueStats();

  }

  async retryFailedJobs(): Promise<void> {
    return this.notificationQueryService.retryFailedJobs();

  }
}