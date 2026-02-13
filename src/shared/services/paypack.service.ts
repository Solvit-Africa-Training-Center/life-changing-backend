// src/shared/services/paypack.service.ts
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
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
  description?: string;
}

interface PaypackTransactionEvent {
  ref: string;
  status: string;
  amount: number;
  fee: number;
  provider: string;
  msisdn: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
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
    
    this.logger.log('✅ Paypack Service Initialized');
    
    if (!this.clientId || !this.clientSecret) {
      this.logger.error('❌ Paypack credentials are not configured');
    }
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret && this.baseUrl);
  }

  private async authenticate(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!this.isConfigured()) {
      throw new Error('Paypack not configured');
    }

    this.logger.log('🔑 Authenticating with Paypack...');

    try {
      const response = await axios.post<PaypackAuthResponse>(
        `${this.baseUrl}/auth/agents/authorize`,
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      this.accessToken = response.data.access;
      this.tokenExpiry = new Date(Date.now() + 55 * 60 * 1000); // 55 minutes
      
      this.logger.log('✅ Paypack authentication successful');
      
      return this.accessToken;
    } catch (error) {
      this.handleAxiosError(error, 'Paypack authentication failed');
    }
  }

  private async makeRequest<T>(
    method: 'get' | 'post',
    endpoint: string,
    data?: any
  ): Promise<T> {
    const token = await this.authenticate();

    try {
      this.logger.debug(`📡 Paypack Request: ${method.toUpperCase()} ${endpoint}`);
      
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data,
      });

      this.logger.debug(`✅ Paypack Response received`);
      return response.data;
    } catch (error) {
      this.handleAxiosError(error, `Paypack request failed: ${endpoint}`);
    }
  }

  private handleAxiosError(error: unknown, defaultMessage: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      this.logger.error(`❌ ${defaultMessage}:`, {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message,
      });

      const responseData = axiosError.response?.data as any;
      const errorMessage = responseData?.message || responseData?.error || axiosError.message;
      
      throw new HttpException(
        errorMessage || defaultMessage,
        axiosError.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.logger.error(`❌ ${defaultMessage}:`, error);
    throw new HttpException(defaultMessage, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  async requestPayment(amount: number, phone: string): Promise<PaypackCashInResponse> {
    this.logger.log(`💰 Requesting payment of ${amount} RWF from ${phone}`);
    
    const response = await this.makeRequest<PaypackCashInResponse>(
      'post',
      '/transactions/cashin',
      {
        amount,
        number: phone,
      }
    );

    this.logger.log(`✅ Payment request successful. Ref: ${response.ref}`);
    return response;
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
    description?: string;
  }> {
    if (!data.phoneNumber) {
      throw new HttpException(
        'Phone number is required for mobile money payments',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Clean phone number (remove spaces, ensure format)
    const cleanPhone = data.phoneNumber.replace(/\s+/g, '');
    
    // Determine payment mode based on payment method
    const mode = data.paymentMethod === PaymentMethod.MTN_MOBILE_MONEY ? 'mtn' : 'airtel';
    
    this.logger.log(`💰 Initiating ${mode} payment of ${data.amount} RWF to ${cleanPhone}`);

    const response = await this.makeRequest<PaypackCashInResponse>(
      'post',
      '/transactions/cashin',
      {
        amount: data.amount,
        number: cleanPhone,
        mode,
        metadata: data.metadata,
      }
    );

    this.logger.log(`✅ Payment initiated. Transaction ID: ${response.ref}`);

    return {
      transactionId: response.ref,
      status: response.status,
      provider: response.provider,
      amount: response.amount,
      fee: response.fee,
      msisdn: response.msisdn,
      description: response.description,
    };
  }

  async verifyPayment(transactionId: string): Promise<PaypackTransactionEvent> {
    this.logger.log(`🔍 Verifying payment: ${transactionId}`);
    
    const response = await this.makeRequest<PaypackTransactionEvent>(
      'get',
      `/transactions/${transactionId}/event`
    );

    this.logger.log(`✅ Payment verification completed. Status: ${response.status}`);
    return response;
  }

  async refundPayment(transactionId: string, amount?: number): Promise<any> {
    this.logger.log(`↩️ Processing refund for transaction: ${transactionId}`);

    // First get the original transaction details
    const transaction = await this.verifyPayment(transactionId);

    const refundResponse = await this.makeRequest<any>(
      'post',
      '/transactions/cashout',
      {
        amount: amount || transaction.amount,
        number: transaction.msisdn,
        mode: transaction.provider,
        metadata: {
          original_transaction: transactionId,
          refund_reason: 'Donation refund',
        },
      }
    );

    this.logger.log(`✅ Refund processed. Refund ID: ${refundResponse.ref}`);
    return refundResponse;
  }

  async getBalance(): Promise<{ balance: number; currency: string }> {
    this.logger.log('💰 Fetching Paypack balance');
    
    const response = await this.makeRequest<any>('get', '/agents/me');
    
    return {
      balance: response.balance || 0,
      currency: 'RWF',
    };
  }
}