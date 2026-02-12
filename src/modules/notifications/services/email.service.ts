// src/modules/notifications/services/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Language } from '../../../config/constants';
import { DonationReceiptData } from '../interfaces/donation-receipt.interface';
import { EmailConfigService } from './email-config.service';
import { SendGridService } from './sendgrid.service';
import { EmailTemplateService } from './email-template.service';
import { EmailDispatchService } from './email-dispatch.service';


@Injectable()
export class EmailService {

  constructor(
    private readonly configService: EmailConfigService,
    private readonly sendGridService: SendGridService,
    private readonly templateService: EmailTemplateService,
    private readonly dispatchService: EmailDispatchService,
  ) {}

   // Email sending methods (delegated)
  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    return this.dispatchService.sendVerificationEmail(email, token);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    return this.dispatchService.sendPasswordResetEmail(email, token);
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    return this.dispatchService.sendWelcomeEmail(email, name);
  }

  async sendAdminAlert(subject: string, message: string): Promise<boolean> {
    return this.dispatchService.sendAdminAlert(subject, message);
  }

  async sendDonationReceipt(email: string, receiptData: DonationReceiptData): Promise<boolean> {
    return this.dispatchService.sendDonationReceipt(email, receiptData);
  }

  async sendRecurringDonationFailedEmail(
    email: string,
    donorName: string,
    amount: number,
    currency: string,
    frequency: string,
    language: Language = Language.EN
  ): Promise<boolean> {
    return this.dispatchService.sendRecurringDonationFailedEmail(
      email,
      donorName,
      amount,
      currency,
      frequency,
      language
    );
  }

  // Configuration methods (delegated)
  isEmailEnabled(): boolean {
    return this.sendGridService.isEnabled();
  }

  // Template generation methods (delegated, for external use if needed)
  generateVerificationEmailTemplate(token: string) {
    return this.templateService.generateVerificationEmail(token);
  }

  generatePasswordResetEmailTemplate(token: string) {
    return this.templateService.generatePasswordResetEmail(token);
  }

  generateDonationReceiptEmailTemplate(data: DonationReceiptData) {
    return this.templateService.generateDonationReceiptEmail(data);
  }
}