// src/modules/notifications/notifications.processor.ts
import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import type { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { EmailService } from '../services/email.service';
import { Notif } from '../entities/notification.entity';
import { NotificationStatus, NotificationType } from '../../../config/constants';
import { SMSService } from '../services/sms.service';
import { Helpers } from '../../../shared/utils/helpers';

@Processor('notifications')
@Injectable()
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private configService: ConfigService,
    private smsService: SMSService,
    private emailService: EmailService,
    private helpers: Helpers,
    @InjectRepository(Notif)
    private notificationsRepository: Repository<Notif>,
  ) {
    this.logger.log('Notifications processor initialized');
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`🔄 [ACTIVE] Processing job ${job.id} of type ${job.name}`);
    this.logger.log(`📦 Job data:`, JSON.stringify(job.data));
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`✅ [COMPLETED] Job ${job.id} of type ${job.name}`);
    this.logger.log(`📊 Result:`, JSON.stringify(result));
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`❌ [FAILED] Job ${job.id} of type ${job.name}: ${error.message}`);
    this.logger.error(`📦 Job data:`, JSON.stringify(job.data));
    this.logger.error(`Stack:`, error.stack);
  }

  // Add this missing handler
  @Process('welcome-notification')
  async handleWelcomeNotification(job: Job) {
    const { notificationId, userId, type, data } = job.data;

    try {
      // Mark the notification as sent
      await this.notificationsRepository.update(notificationId, {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      });

      this.logger.log(`✅ Welcome notification processed for user ${userId}`);
    } catch (error) {
      this.logger.error(`❌ Error processing welcome notification for user ${userId}:`, error.message);
      // Don't throw in development
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  // Add this handler too for password reset notifications
  @Process('password-reset-notification')
  async handlePasswordResetNotification(job: Job) {
    const { notificationId, userId, type, data } = job.data;

    try {
      // Mark the notification as sent
      await this.notificationsRepository.update(notificationId, {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      });

      this.logger.log(`✅ Password reset notification processed for user ${userId}`);
    } catch (error) {
      this.logger.error(`❌ Error processing password reset notification for user ${userId}:`, error.message);
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  // Add this for generic notifications
  @Process('generic-notification')
  async handleGenericNotification(job: Job) {
    const { notificationId, userId, type, data } = job.data;

    try {
      await this.notificationsRepository.update(notificationId, {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      });

      this.logger.log(`✅ Generic notification processed for user ${userId}`);
    } catch (error) {
      this.logger.error(`❌ Error processing generic notification for user ${userId}:`, error.message);
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  @Process('email-verification')
  async handleEmailVerification(job: Job) {
    const { email, token } = job.data;

    try {
      const success = await this.emailService.sendVerificationEmail(email, token);
      if (success) {
        this.logger.log(`✅ Verification email sent to ${email}`);
      } else {
        this.logger.warn(`⚠️ Verification email to ${email} may not have been sent`);
      }
    } catch (error) {
      this.logger.error(`❌ Error sending verification email to ${email}:`, error.message);
      // Don't throw in development
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  @Process('sms-verification')
  async handleSMSVerification(job: Job) {
    const { phone, token } = job.data;

    const formattedPhone = this.helpers.formatPhoneNumber(phone);

    const message = `Welcome to LCEO! Your verification code is: ${token}. Use this to verify your account.`;

    try {
      const success = await this.smsService.sendSMS(formattedPhone, message);
      if (success) {
        this.logger.log(`✅ Verification SMS sent to ${formattedPhone}`);
      } else {
        this.logger.warn(`⚠️ Verification SMS to ${formattedPhone} may not have been sent`);
      }
    } catch (error) {
      this.logger.error(`❌ Error sending verification SMS to ${formattedPhone}:`, error.message);
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  @Process('password-reset-email')
  async handlePasswordResetEmail(job: Job) {
    const { email, token } = job.data;

    try {
      const success = await this.emailService.sendPasswordResetEmail(email, token);
      if (success) {
        this.logger.log(`✅ Password reset email sent to ${email}`);
      } else {
        this.logger.warn(`⚠️ Password reset email to ${email} may not have been sent`);
      }
    } catch (error) {
      this.logger.error(`❌ Error sending password reset email to ${email}:`, error.message);
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  @Process('password-reset-sms')
  async handlePasswordResetSMS(job: Job) {
    const { phone, token } = job.data;
    const formattedPhone = this.helpers.formatPhoneNumber(phone);
    const message = `LCEO Password Reset: Use this code to reset your password: ${token}`;

    try {
      const success = await this.smsService.sendSMS(formattedPhone, message);
      if (success) {
        this.logger.log(`✅ Password reset SMS sent to ${formattedPhone}`);
      } else {
        this.logger.warn(`⚠️ Password reset SMS to ${formattedPhone} may not have been sent`);
      }
    } catch (error) {
      this.logger.error(`❌ Error sending password reset SMS to ${formattedPhone}:`, error.message);
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  // You might also want to add handlers for other notification types
  @Process('system-alert')
  async handleSystemAlert(job: Job) {
    const { notificationId, userId, data } = job.data;

    try {
      await this.notificationsRepository.update(notificationId, {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      });

      this.logger.log(`✅ System alert processed for user ${userId}`);
    } catch (error) {
      this.logger.error(`❌ Error processing system alert for user ${userId}:`, error.message);
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  @Process('donation-receipt-email')
  async handleDonationReceiptEmail(job: Job) {
    const { email, receiptData } = job.data;
    try {
      const success = await this.emailService.sendDonationReceipt(email, receiptData);
      if (success) {
        this.logger.log(`Donation receipt email sent to ${email}`);
      } else {
        this.logger.error(`Failed to send donation receipt email to ${email}`);
        throw new Error('Email sending failed');
      }
    } catch (error) {
      this.logger.error(`Error processing donation receipt email: ${error.message}`);
      throw error;
    }
  }

  @Process('donation-receipt-sms')
  async handleDonationReceiptSMS(job: Job) {
    const { phone, message } = job.data;
    const formattedPhone = this.helpers.formatPhoneNumber(phone);
    try {
      const success = await this.smsService.sendSMS(formattedPhone, message);

      if (success) {
        this.logger.log(`Donation receipt SMS sent to ${formattedPhone}`);
      } else {
        this.logger.error(`Failed to send donation receipt SMS to ${formattedPhone}`);
        throw new Error('SMS sending failed');
      }
    } catch (error) {
      this.logger.error(`Error processing donation receipt SMS: ${error.message}`);
      throw error;
    }
  }

  @Process('recurring-donation-failed-email')
  async handleRecurringDonationFailedEmail(job: Job) {
    const { email, donorName, amount, currency, frequency, language } = job.data;
    try {
      const success = await this.emailService.sendRecurringDonationFailedEmail(
        email,
        donorName,
        amount,
        currency,
        frequency,
        language
      );
      if (success) {
        this.logger.log(`Recurring donation failed email sent to ${email}`);
      } else {
        this.logger.error(`Failed to send recurring donation failed email to ${email}`);
        throw new Error('Email sending failed');
      }
    } catch (error) {
      this.logger.error(`Error processing recurring donation failed email: ${error.message}`);
      throw error;
    }
  }
}