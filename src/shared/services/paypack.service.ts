// src/shared/services/paypack.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PaymentMethod } from '../../config/constants';

interface PaypackAuthResponse {
  access: string;
  refresh: string;
}

interface PaypackCashInResponse {
  ref: string;
  status: string;
  amount: number;
  fee: number;
  provider: string;
  msisdn: string;
}

@Injectable()
export class PaypackService {
  private readonly logger = new Logger(PaypackService.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string;
  private tokenExpiry: Date;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('config.paypack.baseUrl') as string;
    this.clientId = this.configService.get<string>('config.paypack.clientId') as string;
    this.clientSecret = this.configService.get<string>('config.paypack.clientSecret') as string;
    
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Paypack credentials are not configured');
    }
  }

  private async authenticate(): Promise<void> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return;
    }

    try {
      const response = await axios.post<PaypackAuthResponse>(
        `${this.baseUrl}/auth/agents/authorize`,
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }
      );

      this.accessToken = response.data.access;
      this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000);
    } catch (error) {
      this.logger.error('Paypack authentication failed:', error);
      throw new Error('Failed to authenticate with Paypack');
    }
  }

  private async makeRequest<T>(method: 'get' | 'post', endpoint: string, data?: any): Promise<T> {
    await this.authenticate();

    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        data,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`Paypack request failed: ${endpoint}`, error.response?.data || error.message);
      throw error;
    }
  }

  async initiateMobileMoneyPayment(data: {
    amount: number;
    phoneNumber: string;
    paymentMethod: PaymentMethod;
    metadata?: Record<string, any>;
  }): Promise<{
    transactionId: string;
    status: string;
    provider: string;
    amount: number;
    fee: number;
    msisdn: string;
  }> {
    try {
      if (!data.phoneNumber) {
        throw new Error('Phone number is required for mobile money payments');
      }

      const mode = data.paymentMethod === PaymentMethod.MTN_MOBILE_MONEY ? 'mtn' : 'airtel';
      
      const response = await this.makeRequest<PaypackCashInResponse>(
        'post',
        '/transactions/cashin',
        {
          amount: data.amount,
          msisdn: data.phoneNumber,
          mode,
          metadata: data.metadata,
        }
      );

      return {
        transactionId: response.ref,
        status: response.status,
        provider: response.provider,
        amount: response.amount,
        fee: response.fee,
        msisdn: response.msisdn,
      };
    } catch (error) {
      this.logger.error('Failed to initiate Paypack payment:', error);
      throw error;
    }
  }

  async verifyPayment(transactionId: string): Promise<any> {
    try {
      return await this.makeRequest<any>(
        'get',
        `/transactions/${transactionId}/event`
      );
    } catch (error) {
      this.logger.error('Failed to verify Paypack payment:', error);
      throw error;
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<any> {
    try {
      const transaction = await this.makeRequest<any>(
        'get',
        `/transactions/${transactionId}/event`
      );

      const refundResponse = await this.makeRequest<any>(
        'post',
        '/transactions/cashout',
        {
          amount: amount || transaction.amount,
          msisdn: transaction.msisdn,
          mode: transaction.provider,
          metadata: {
            original_transaction: transactionId,
            refund_reason: 'Donation refund',
          },
        }
      );

      return refundResponse;
    } catch (error) {
      this.logger.error('Failed to create Paypack refund:', error);
      throw error;
    }
  }
}