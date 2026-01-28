import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AfricasTalking from 'africastalking';

@Injectable()
export class AfricasTalkingService {
  private client: any;

  constructor(private configService: ConfigService) {
    // Initialize Africa's Talking client
    const apiKey = this.configService.get('config.africasTalking.apiKey');
    const username = this.configService.get('config.africasTalking.username');

    if (apiKey && username) {
      this.client = AfricasTalking({
        apiKey,
        username,
      }).SMS;
    }
  }

  async sendSMS(phone: string, message: string): Promise<void> {
    if (!this.client) {
      throw new Error('Africa\'s Talking client not initialized');
    }

    try {
      await this.client.send({
        to: phone,
        message: message,
        from: this.configService.get('config.africasTalking.senderId'),
      });
    } catch (error) {
      console.error('Africa\'s Talking SMS error:', error);
      throw error;
    }
  }

  async sendBulkSMS(phones: string[], message: string): Promise<void> {
    if (!this.client) {
      throw new Error('Africa\'s Talking client not initialized');
    }

    try {
      await this.client.send({
        to: phones,
        message: message,
        from: this.configService.get('config.africasTalking.senderId'),
      });
    } catch (error) {
      console.error('Africa\'s Talking bulk SMS error:', error);
      throw error;
    }
  }
}