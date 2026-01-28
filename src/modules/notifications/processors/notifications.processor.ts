// src/modules/notifications/processors/notifications.processor.ts
import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import type { Job } from 'bull';
import * as sgMail from '@sendgrid/mail';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AfricasTalkingService } from '../africas-talking.service';
import { Notif } from '../entities/notification.entity';
import { NotificationStatus, NotificationType } from '../../../config/constants';

@Processor('notifications')
@Injectable()
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private configService: ConfigService,
    private africasTalkingService: AfricasTalkingService,
    @InjectRepository(Notif)
    private notificationsRepository: Repository<Notif>,
  ) {
    // Initialize SendGrid
    const sendgridApiKey = this.configService.get('config.sendgrid.apiKey');
    if (sendgridApiKey) {
      sgMail.setApiKey(sendgridApiKey);
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job) {
    this.logger.log(`Completed job ${job.id} of type ${job.name}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Failed job ${job.id} of type ${job.name}: ${error.message}`);
  }

  @Process('email-verification')
  async handleEmailVerification(job: Job) {
    const { email, token } = job.data;
    
    const frontendUrl = this.configService.get('config.frontendUrl');
    const verificationLink = `${frontendUrl}/verify-account?token=${token}`;
    
    const msg = {
      to: email,
      from: {
        email: this.configService.get('config.sendgrid.fromEmail'),
        name: this.configService.get('config.sendgrid.fromName'),
      },
      subject: 'Verify Your LCEO Account',
      html: `
        <h1>Verify Your LCEO Account</h1>
        <p>Click the link below to verify your account:</p>
        <a href="${verificationLink}">${verificationLink}</a>
        <p>Or use this verification code: ${token}</p>
        <p>This link expires in 24 hours.</p>
      `,
      text: `Verify your LCEO account: ${verificationLink}\nOr use this code: ${token}`,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`✅ Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`❌ Error sending verification email to ${email}:`, error);
      throw error;
    }
  }

  @Process('sms-verification')
  async handleSMSVerification(job: Job) {
    const { phone, token } = job.data;
    
    const message = `Welcome to LCEO! Your verification code is: ${token}. Use this to verify your account.`;
    
    try {
      await this.africasTalkingService.sendSMS(phone, message);
      this.logger.log(`✅ Verification SMS sent to ${phone}`);
    } catch (error) {
      this.logger.error(`❌ Error sending verification SMS to ${phone}:`, error);
      throw error;
    }
  }

  @Process('password-reset-email')
  async handlePasswordResetEmail(job: Job) {
    const { email, token } = job.data;
    
    const frontendUrl = this.configService.get('config.frontendUrl');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    
    const msg = {
      to: email,
      from: {
        email: this.configService.get('config.sendgrid.fromEmail'),
        name: this.configService.get('config.sendgrid.fromName'),
      },
      subject: 'Reset Your LCEO Password',
      html: `
        <h1>Reset Your LCEO Password</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>Or use this reset code: ${token}</p>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      text: `Reset your LCEO password: ${resetLink}\nOr use this code: ${token}\nExpires in 1 hour.`,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`✅ Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`❌ Error sending password reset email to ${email}:`, error);
      throw error;
    }
  }

  @Process('password-reset-sms')
  async handlePasswordResetSMS(job: Job) {
    const { phone, token } = job.data;
    
    const message = `LCEO Password Reset: Your reset code is ${token}. This code expires in 1 hour.`;
    
    try {
      await this.africasTalkingService.sendSMS(phone, message);
      this.logger.log(`✅ Password reset SMS sent to ${phone}`);
    } catch (error) {
      this.logger.error(`❌ Error sending password reset SMS to ${phone}:`, error);
      throw error;
    }
  }

  @Process('welcome-notification')
  async handleWelcomeNotification(job: Job) {
    const { notificationId } = job.data;
    
    try {
      if (notificationId) {
        await this.notificationsRepository.update(notificationId, {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        });
      }
      this.logger.log(`✅ Welcome notification processed: ${notificationId}`);
    } catch (error) {
      this.logger.error(`❌ Error processing welcome notification ${notificationId}:`, error);
      
      if (notificationId) {
        await this.notificationsRepository.update(notificationId, {
          status: NotificationStatus.FAILED,
        });
      }
      throw error;
    }
  }

  @Process('password-reset-notification')
  async handlePasswordResetNotification(job: Job) {
    const { notificationId } = job.data;
    
    try {
      if (notificationId) {
        await this.notificationsRepository.update(notificationId, {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        });
      }
      this.logger.log(`✅ Password reset notification processed: ${notificationId}`);
    } catch (error) {
      this.logger.error(`❌ Error processing password reset notification ${notificationId}:`, error);
      
      if (notificationId) {
        await this.notificationsRepository.update(notificationId, {
          status: NotificationStatus.FAILED,
        });
      }
      throw error;
    }
  }

  @Process('generic-notification')
  async handleGenericNotification(job: Job) {
    const { notificationId } = job.data;
    
    try {
      if (notificationId) {
        await this.notificationsRepository.update(notificationId, {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        });
      }
      this.logger.log(`✅ Generic notification processed: ${notificationId}`);
    } catch (error) {
      this.logger.error(`❌ Error processing notification ${notificationId}:`, error);
      
      if (notificationId) {
        await this.notificationsRepository.update(notificationId, {
          status: NotificationStatus.FAILED,
        });
      }
      throw error;
    }
  }
}