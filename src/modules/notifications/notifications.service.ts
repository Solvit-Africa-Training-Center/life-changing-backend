import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { AfricasTalkingService } from './africas-talking.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class NotificationService {
  constructor(
    private configService: ConfigService,
    private africasTalkingService: AfricasTalkingService,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {
    // Initialize SendGrid
    const sendgridApiKey = this.configService.get('config.sendgrid.apiKey');
    if (sendgridApiKey) {
      sgMail.setApiKey(sendgridApiKey);
    }
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
      templateId: 'd-1234567890abcdef1234567890abcdef', // Create template in SendGrid
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
      templateId: 'd-abcdef1234567890abcdef1234567890', // Create template in SendGrid
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

  // Queue email for async processing
  async queueEmailVerification(email: string, token: string): Promise<void> {
    await this.notificationsQueue.add('email-verification', {
      email,
      token,
      type: 'verification',
    });
  }

  // Queue SMS for async processing
  async queueSMSVerification(phone: string, token: string): Promise<void> {
    await this.notificationsQueue.add('sms-verification', {
      phone,
      token,
      type: 'verification',
    });
  }
}
