// src/modules/notifications/services/sendgrid.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EmailConfigService } from './email-config.service';

interface SendGridMessage {
  to: string;
  from: { email: string; name: string };
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);
  private sendgridEnabled = false;
  private sgMail: any = null;

  constructor(private configService: EmailConfigService) {
    this.initializeSendGrid();
  }

  private async initializeSendGrid() {
    const apiKey = this.configService.getSendGridApiKey();
    
    if (!apiKey || !this.configService.isSendGridEnabled()) {
      this.configService.logWarning('SendGrid API key not found or invalid. Email notifications will be simulated.');
      return;
    }

    try {
      const sgMailModule = await import('@sendgrid/mail');
      this.sgMail = sgMailModule.default;
      
      if (this.sgMail && typeof this.sgMail.setApiKey === 'function') {
        this.sgMail.setApiKey(apiKey);
        this.sendgridEnabled = true;
        this.configService.logInfo('SendGrid initialized successfully');
      } else {
        this.configService.logWarning('SendGrid MailService not found in expected format');
      }
    } catch (error) {
      this.configService.logError('Failed to initialize SendGrid:', error);
    }
  }

  async sendEmail(msg: SendGridMessage): Promise<boolean> {
    if (!this.sendgridEnabled) {
      this.simulateEmail(msg);
      return true;
    }

    try {
      await this.sendViaSendGrid(msg);
      this.logger.log(`✅ Email sent to ${msg.to}`);
      return true;
    } catch (error: any) {
      return this.handleSendError(error, msg);
    }
  }

  private async sendViaSendGrid(msg: SendGridMessage): Promise<void> {
    if (this.sgMail && typeof this.sgMail.send === 'function') {
      await this.sgMail.send(msg);
    } else {
      throw new Error('SendGrid send method not found');
    }
  }

  private handleSendError(error: any, msg: SendGridMessage): boolean {
    this.configService.logError(`❌ Error sending email to ${msg.to}:`, error);
    
    if (error.response?.body) {
      this.logger.error('SendGrid response:', error.response.body);
    }
    
    // In development, simulate success
    if (process.env.NODE_ENV !== 'production') {
      this.simulateEmail(msg);
      return true;
    }
    
    return false;
  }

  private simulateEmail(msg: SendGridMessage): void {
    this.logger.log(`[SIMULATED EMAIL] To: ${msg.to}`);
    this.logger.log(`[SIMULATED EMAIL] Subject: ${msg.subject}`);
    this.logger.log(`[SIMULATED EMAIL] Body: ${msg.text}`);
  }

  isEnabled(): boolean {
    return this.sendgridEnabled;
  }
}