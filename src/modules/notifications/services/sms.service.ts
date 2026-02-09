// src/modules/notifications/sms.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SMSProvider {
  sendSMS(phone: string, message: string): Promise<boolean>;
  sendBulkSMS(phones: string[], message: string): Promise<boolean>;
  isAvailable(): boolean;
}

@Injectable()
export class SMSService {
  private providers: SMSProvider[] = [];
  private readonly logger = new Logger(SMSService.name);

  constructor(private configService: ConfigService) {
    this.initializeProviders();
  }

  private async initializeProviders() {
    // Try to initialize Africa's Talking
    const africastalkingProvider = await this.initializeAfricasTalking();
    if (africastalkingProvider) {
      this.providers.push(africastalkingProvider);
      this.logger.log('Africa\'s Talking SMS provider initialized');
    }

    // You can add more providers here (Twilio, etc.)
    
    if (this.providers.length === 0) {
      this.logger.warn('No SMS providers available. SMS notifications will be simulated.');
      this.providers.push(this.createMockProvider());
    }
  }

  private async initializeAfricasTalking(): Promise<SMSProvider | null> {
    try {
      const apiKey = this.configService.get('config.africasTalking.apiKey');
      const username = this.configService.get('config.africasTalking.username');
      
      if (!apiKey || !username) {
        this.logger.warn('Africa\'s Talking credentials not provided');
        return null;
      }

      // Dynamic import to avoid breaking the app if module is not installed
      const AfricasTalking = await import('africastalking');
      
      let africastalking;
      if (typeof AfricasTalking === 'function') {
        africastalking = AfricasTalking({ apiKey, username });
      } else if (AfricasTalking.default) {
        africastalking = AfricasTalking.default({ apiKey, username });
      } else {
        africastalking = new AfricasTalking({ apiKey, username });
      }

      const smsClient = africastalking.SMS;

      return {
        sendSMS: async (phone: string, message: string) => {
          try {
            await smsClient.send({
              to: phone,
              message,
              from: this.configService.get('config.africasTalking.senderId') || 'INFO',
            });
            return true;
          } catch (error) {
            this.logger.error(`Africa's Talking SMS error: ${error.message}`);
            return false;
          }
        },
        sendBulkSMS: async (phones: string[], message: string) => {
          try {
            await smsClient.send({
              to: phones,
              message,
              from: this.configService.get('config.africasTalking.senderId') || 'INFO',
            });
            return true;
          } catch (error) {
            this.logger.error(`Africa's Talking bulk SMS error: ${error.message}`);
            return false;
          }
        },
        isAvailable: () => true,
      };
    } catch (error) {
      this.logger.error('Failed to initialize Africa\'s Talking:', error.message);
      return null;
    }
  }

  private createMockProvider(): SMSProvider {
    return {
      sendSMS: async (phone: string, message: string) => {
        this.logger.log(`[MOCK] SMS to ${phone}: ${message}`);
        return true;
      },
      sendBulkSMS: async (phones: string[], message: string) => {
        this.logger.log(`[MOCK] Bulk SMS to ${phones.length} numbers: ${message}`);
        return true;
      },
      isAvailable: () => true,
    };
  }

  async sendSMS(phone: string, message: string): Promise<boolean> {
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        const success = await provider.sendSMS(phone, message);
        if (success) {
          return true;
        }
      }
    }
    return false;
  }

  async sendBulkSMS(phones: string[], message: string): Promise<boolean> {
    for (const provider of this.providers) {
      if (provider.isAvailable()) {
        const success = await provider.sendBulkSMS(phones, message);
        if (success) {
          return true;
        }
      }
    }
    return false;
  }

  isSMSAvailable(): boolean {
    return this.providers.some(provider => provider.isAvailable());
  }
}