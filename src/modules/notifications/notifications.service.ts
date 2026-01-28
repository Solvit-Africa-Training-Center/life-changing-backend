// src/modules/notifications/services/notification.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as sgMail from '@sendgrid/mail';
import { AfricasTalkingService } from './africas-talking.service';
import type { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

import { Notification as Notif } from './entities/notification.entity';
import { NotificationType, NotificationStatus, NotificationChannel, Language } from '../../config/constants';

@Injectable()
export class NotificationService {
  constructor(
    private configService: ConfigService,
    private africasTalkingService: AfricasTalkingService,
    @InjectRepository(Notif)
    private notificationsRepository: Repository<Notif>,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {
    // Initialize SendGrid
    const sendgridApiKey = this.configService.get('config.sendgrid.apiKey');
    if (sendgridApiKey) {
      sgMail.setApiKey(sendgridApiKey);
    }
  }

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

    return await this.notificationsRepository.save(notification);
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get('config.frontendUrl');
    const verificationLink = `${frontendUrl}/verify-account?token=${token}`;
    
    const msg = {
      to: email,
      from: {
        email: this.configService.get('config.sendgrid.fromEmail'),
        name: this.configService.get('config.sendgrid.fromName'),
      },
      subject: 'Verify Your LCEO Account',
      templateId: 'd-1234567890abcdef1234567890abcdef',
      dynamicTemplateData: {
        verification_link: verificationLink,
        token: token,
      },
    };

    try {
      await sgMail.send(msg);
      console.log(`Verification email sent to ${email}`);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  async sendSMSVerification(phone: string, token: string): Promise<void> {
    const message = `Welcome to LCEO! Your verification code is: ${token}. Use this to verify your account.`;
    
    try {
      await this.africasTalkingService.sendSMS(phone, message);
      console.log(`Verification SMS sent to ${phone}`);
    } catch (error) {
      console.error('Error sending verification SMS:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get('config.frontendUrl');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    
    const msg = {
      to: email,
      from: {
        email: this.configService.get('config.sendgrid.fromEmail'),
        name: this.configService.get('config.sendgrid.fromName'),
      },
      subject: 'Reset Your LCEO Password',
      templateId: 'd-abcdef1234567890abcdef1234567890',
      dynamicTemplateData: {
        reset_link: resetLink,
        token: token,
        expiry_time: '1 hour',
      },
    };

    try {
      await sgMail.send(msg);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  async sendPasswordResetSMS(phone: string, token: string): Promise<void> {
    const message = `LCEO Password Reset: Your reset code is ${token}. This code expires in 1 hour.`;
    
    try {
      await this.africasTalkingService.sendSMS(phone, message);
      console.log(`Password reset SMS sent to ${phone}`);
    } catch (error) {
      console.error('Error sending password reset SMS:', error);
      throw error;
    }
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
}