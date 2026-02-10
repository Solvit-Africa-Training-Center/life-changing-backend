// src/shared/services/stripe.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
    private readonly logger = new Logger(StripeService.name);
    private stripe: Stripe;

    constructor(private configService: ConfigService) {
        const secretKey = this.configService.get('config.stripe.secretKey');
        if (!secretKey) {
            throw new Error('Stripe secret key is not configured');
        }

        this.stripe = new Stripe(secretKey, {
            apiVersion:'2026-01-28.clover',
            typescript: true,
        });
    }

    async createPaymentIntent(data: {
        amount: number;
        currency: string;
        metadata?: Record<string, any>;
    }): Promise<{
        clientSecret: string | null ;
        paymentIntentId: string;
        status: string;
    }> {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: data.amount,
                currency: data.currency.toLowerCase(),
                payment_method_types: ['card'],
                metadata: data.metadata || {},
            });

            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                status: paymentIntent.status,
            };
        } catch (error) {
            this.logger.error('Failed to create Stripe payment intent:', error);
            throw error;
        }
    }

    async confirmPayment(paymentIntentId: string): Promise<any> {
        try {
            return await this.stripe.paymentIntents.retrieve(paymentIntentId);
        } catch (error) {
            this.logger.error('Failed to confirm Stripe payment:', error);
            throw error;
        }
    }

    async createSubscription(data: {
        customerId: string;
        amount: number;
        currency: string;
        interval: 'month' | 'year';
        metadata?: Record<string, any>;
    }): Promise<any> {
        try {
            // Create price directly with product data (one-step approach)
            const price = await this.stripe.prices.create({
                currency: data.currency.toLowerCase(),
                unit_amount: data.amount,
                recurring: {
                    interval: data.interval,
                },
                product_data: {
                    name: `${data.interval.charAt(0).toUpperCase() + data.interval.slice(1)}ly Donation`,
                },
            });

            // Create subscription with the price
            return await this.stripe.subscriptions.create({
                customer: data.customerId,
                items: [{
                    price: price.id,
                }],
                payment_behavior: 'default_incomplete',
                expand: ['latest_invoice.payment_intent'],
                metadata: data.metadata,
            });
        } catch (error) {
            this.logger.error('Failed to create Stripe subscription:', error);
            throw error;
        }
    }
    async cancelSubscription(subscriptionId: string): Promise<void> {
        await this.stripe.subscriptions.cancel(subscriptionId);
    }

    verifyWebhookSignature(payload: any, signature: string): boolean {
        const webhookSecret = this.configService.get('stripe.webhookSecret');

        try {
            const event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                webhookSecret
            );
            return !!event;
        } catch (error) {
            this.logger.error('Stripe webhook signature verification failed:', error);
            return false;
        }
    }
}