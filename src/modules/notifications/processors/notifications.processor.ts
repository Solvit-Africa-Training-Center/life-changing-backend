// Updated NotificationsProcessor using EmailService
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

@Processor('notifications')
@Injectable()
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private configService: ConfigService,
    private smsService: SMSService,
    private emailService: EmailService,
    @InjectRepository(Notif)
    private notificationsRepository: Repository<Notif>,
  ) {
    this.logger.log('Notifications processor initialized');
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
    
    const message = `Welcome to LCEO! Your verification code is: ${token}. Use this to verify your account.`;
    
    try {
      const success = await this.smsService.sendSMS(phone, message);
      if (success) {
        this.logger.log(`✅ Verification SMS sent to ${phone}`);
      } else {
        this.logger.warn(`⚠️ Verification SMS to ${phone} may not have been sent`);
      }
    } catch (error) {
      this.logger.error(`❌ Error sending verification SMS to ${phone}:`, error.message);
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  // ... update other methods similarly
}