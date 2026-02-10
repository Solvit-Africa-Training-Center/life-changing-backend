// src/modules/notifications/services/sms-notification.service.ts
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class SMSNotificationService {
  constructor(
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

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

  async sendDonationReceiptSMS(phone: string, message: string): Promise<void> {
    await this.notificationsQueue.add('donation-receipt-sms', {
      phone,
      message,
      timestamp: new Date().toISOString(),
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}