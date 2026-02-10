// src/modules/notifications/services/email-notification.service.ts
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { DonationReceiptData } from '../../donations/interfaces/donation-receipt.interface';
import { Language } from '../../../config/constants';

@Injectable()
export class EmailNotificationService {
  constructor(
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

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

  async sendDonationReceiptEmail(email: string, receiptData: DonationReceiptData): Promise<void> {
    await this.notificationsQueue.add('donation-receipt-email', {
      email,
      receiptData,
      timestamp: new Date().toISOString(),
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }

  async sendRecurringDonationFailedEmail(
    email: string,
    donorName: string,
    amount: number,
    currency: string,
    frequency: string,
    language: Language = Language.EN
  ): Promise<void> {
    await this.notificationsQueue.add('recurring-donation-failed-email', {
      email,
      donorName,
      amount,
      currency,
      frequency,
      language,
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