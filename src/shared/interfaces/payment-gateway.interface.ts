// src/shared/interfaces/payment-gateway.interface.ts
export interface PaymentGateway {
  createPaymentIntent(data: PaymentData): Promise<PaymentResponse>;
  confirmPayment(paymentId: string): Promise<PaymentResponse>;
  refundPayment(paymentId: string, amount?: number): Promise<RefundResponse>;
  createSubscription?(data: SubscriptionData): Promise<SubscriptionResponse>;
  cancelSubscription?(subscriptionId: string): Promise<void>;
  verifyWebhookSignature?(payload: any, signature: string): boolean;
}

export interface PaymentData {
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  clientSecret?: string;
  paymentUrl?: string;
  requiresAction?: boolean;
  nextAction?: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface SubscriptionData {
  customerId: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  metadata?: Record<string, any>;
}

export interface SubscriptionResponse {
  subscriptionId: string;
  clientSecret?: string;
  status: string;
  nextPaymentDate?: Date;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  amount: number;
  currency: string;
  status: string;
}