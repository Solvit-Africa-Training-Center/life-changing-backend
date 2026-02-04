// src/modules/notifications/services/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendGridMessage {
  to: string;
  from: { email: string; name: string };
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private sendgridEnabled = false;

  constructor(private configService: ConfigService) {
    this.initializeSendGrid();
  }

  private async initializeSendGrid() {
    const sendgridApiKey = this.configService.get('config.sendgrid.apiKey');
    
    if (!sendgridApiKey || !sendgridApiKey.startsWith('SG.')) {
      this.logger.warn('SendGrid API key not found or invalid. Email notifications will be simulated.');
      return;
    }

    try {
      // Dynamic import to avoid breaking app if SendGrid is not properly installed
      const sgMailModule = await import('@sendgrid/mail');
      
      // SendGrid exports a default MailService class
      const sgMail = sgMailModule.default;
      
      if (sgMail && typeof sgMail.setApiKey === 'function') {
        sgMail.setApiKey(sendgridApiKey);
        this.sendgridEnabled = true;
        this.logger.log('SendGrid initialized successfully');
      } else {
        this.logger.warn('SendGrid MailService not found in expected format');
      }
    } catch (error) {
      this.logger.error('Failed to initialize SendGrid:', error.message);
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get('config.frontendUrl');
    const verificationLink = `${frontendUrl}/verify-account?token=${token}`;
    
    const msg: SendGridMessage = {
      to: email,
      from: {
        email: this.configService.get('config.sendgrid.fromEmail') || 'noreply@lceo.org',
        name: this.configService.get('config.sendgrid.fromName') || 'LCEO',
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

    return this.sendEmail(msg);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get('config.frontendUrl');
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;
    
    const msg: SendGridMessage = {
      to: email,
      from: {
        email: this.configService.get('config.sendgrid.fromEmail') || 'noreply@lceo.org',
        name: this.configService.get('config.sendgrid.fromName') || 'LCEO',
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

    return this.sendEmail(msg);
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const msg: SendGridMessage = {
      to: email,
      from: {
        email: this.configService.get('config.sendgrid.fromEmail') || 'noreply@lceo.org',
        name: this.configService.get('config.sendgrid.fromName') || 'LCEO',
      },
      subject: 'Welcome to LCEO!',
      html: `
        <h1>Welcome to LCEO, ${name}!</h1>
        <p>Thank you for joining the Life Changing Economic Opportunities platform.</p>
        <p>We're excited to have you on board and look forward to helping you achieve your goals.</p>
        <p>You can now:</p>
        <ul>
          <li>Access your dashboard</li>
          <li>Update your profile</li>
          <li>Track your progress</li>
          <li>Connect with other beneficiaries</li>
        </ul>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>The LCEO Team</p>
      `,
      text: `Welcome to LCEO, ${name}!\n\nThank you for joining the Life Changing Economic Opportunities platform.\n\nYou can now access your dashboard, update your profile, track your progress, and connect with other beneficiaries.\n\nBest regards,\nThe LCEO Team`,
    };

    return this.sendEmail(msg);
  }

  async sendAdminAlert(subject: string, message: string): Promise<boolean> {
    const adminEmail = this.configService.get('config.sendgrid.adminEmail');
    
    if (!adminEmail) {
      this.logger.warn('Admin email not configured');
      return false;
    }
    
    const msg: SendGridMessage = {
      to: adminEmail,
      from: {
        email: this.configService.get('config.sendgrid.fromEmail') || 'noreply@lceo.org',
        name: this.configService.get('config.sendgrid.fromName') || 'LCEO',
      },
      subject: `LCEO Admin Alert: ${subject}`,
      html: `
        <h1>Admin Alert: ${subject}</h1>
        <p>${message}</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
      text: `Admin Alert: ${subject}\n\n${message}\n\nTimestamp: ${new Date().toISOString()}`,
    };

    return this.sendEmail(msg);
  }

  private async sendEmail(msg: SendGridMessage): Promise<boolean> {
    if (!this.sendgridEnabled) {
      // Simulate email in development
      this.logger.log(`[SIMULATED EMAIL] To: ${msg.to}`);
      this.logger.log(`[SIMULATED EMAIL] Subject: ${msg.subject}`);
      this.logger.log(`[SIMULATED EMAIL] Body: ${msg.text}`);
      return true;
    }

    try {
      const sgMailModule = await import('@sendgrid/mail');
      const sgMail = sgMailModule.default;
      
      if (sgMail && typeof sgMail.send === 'function') {
        await sgMail.send(msg);
        this.logger.log(`✅ Email sent to ${msg.to}`);
        return true;
      } else {
        this.logger.error('SendGrid send method not found');
        return false;
      }
    } catch (error: any) {
      this.logger.error(`❌ Error sending email to ${msg.to}:`, error.message);
      
      // Log SendGrid response details if available
      if (error.response?.body) {
        this.logger.error('SendGrid response:', error.response.body);
      }
      
      // In development, simulate success
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`[DEV FALLBACK] Simulating successful email to ${msg.to}`);
        return true;
      }
      
      return false;
    }
  }

  isEmailEnabled(): boolean {
    return this.sendgridEnabled;
  }
}