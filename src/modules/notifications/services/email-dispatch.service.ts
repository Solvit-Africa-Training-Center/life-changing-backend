// src/modules/notifications/services/email-dispatch.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Language } from '../../../config/constants';
import { DonationReceiptData } from '../interfaces/donation-receipt.interface';
import { SendGridService } from './sendgrid.service';
import { EmailConfigService } from './email-config.service';
import { EmailTemplateService } from './email-template.service';

@Injectable()
export class EmailDispatchService {
  private readonly logger = new Logger(EmailDispatchService.name);

  constructor(
    private sendGridService: SendGridService,
    private templateService: EmailTemplateService,
    private configService: EmailConfigService,
  ) {}

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const template = this.templateService.generateVerificationEmail(token);
    return this.sendEmail(email, template);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const template = this.templateService.generatePasswordResetEmail(token);
    return this.sendEmail(email, template);
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const template = this.templateService.generateWelcomeEmail(name);
    return this.sendEmail(email, template);
  }

  async sendAdminAlert(subject: string, message: string): Promise<boolean> {
    const adminEmail = this.configService.getAdminEmail();
    
    if (!adminEmail) {
      this.configService.logWarning('Admin email not configured');
      return false;
    }
    
    const template = this.templateService.generateAdminAlertEmail(subject, message);
    return this.sendEmail(adminEmail, template);
  }

  async sendDonationReceipt(email: string, receiptData: DonationReceiptData): Promise<boolean> {
    const template = this.templateService.generateDonationReceiptEmail(receiptData);
    return this.sendEmail(email, template);
  }

  async sendRecurringDonationFailedEmail(
    email: string,
    donorName: string,
    amount: number,
    currency: string,
    frequency: string,
    language: Language = Language.EN
  ): Promise<boolean> {
    const template = this.templateService.generateRecurringDonationFailedEmail(
      donorName,
      amount,
      currency,
      frequency,
      language
    );
    
    return this.sendEmail(email, template);
  }

  private async sendEmail(email: string, template: { subject: string; html: string; text: string }): Promise<boolean> {
    const message = {
      to: email,
      from: {
        email: this.configService.getFromEmail(),
        name: this.configService.getFromName(),
      },
      subject: template.subject,
      html: template.html,
      text: template.text,
    };

    return this.sendGridService.sendEmail(message);
  }
}