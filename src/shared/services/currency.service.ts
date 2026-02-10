// src/shared/services/currency.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Currency } from '../../config/constants';

@Injectable()
export class CurrencyService {
  private exchangeRates: Record<string, Record<string, number>>;

  constructor(private configService: ConfigService) {
    this.exchangeRates = {
      [Currency.USD]: {
        [Currency.RWF]: this.configService.get('config.payment.exchangeRate.usdToRwf', 1300),
        [Currency.EUR]: 0.92,
      },
      [Currency.EUR]: {
        [Currency.RWF]: this.configService.get('config.payment.exchangeRate.eurToRwf', 1400),
        [Currency.USD]: 1.09,
      },
      [Currency.RWF]: {
        [Currency.USD]: 1 / this.configService.get('config.payment.exchangeRate.usdToRwf', 1300),
        [Currency.EUR]: 1 / this.configService.get('config.payment.exchangeRate.eurToRwf', 1400),
      },
    };
  }

  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;
    
    const rate = this.exchangeRates[fromCurrency]?.[toCurrency];
    if (!rate) {
      throw new Error(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
    }
    
    return parseFloat((amount * rate).toFixed(2));
  }

  formatForStripe(amount: number, currency: string): number {
    const isDecimalCurrency = [Currency.USD, Currency.EUR].includes(currency as Currency);
    return isDecimalCurrency ? Math.round(amount * 100) : Math.round(amount);
  }

  parseFromStripe(amount: number, currency: string): number {
    const isDecimalCurrency = [Currency.USD, Currency.EUR].includes(currency as Currency);
    return isDecimalCurrency ? amount / 100 : amount;
  }

  getGatewayForCurrency(currency: string): 'stripe' | 'paypack' {
    if ([Currency.USD, Currency.EUR].includes(currency as Currency)) {
      return 'stripe';
    } else if (currency === Currency.RWF) {
      return 'paypack';
    }
    throw new Error(`Unsupported currency: ${currency}`);
  }

  getSupportedCurrencies(gateway: 'stripe' | 'paypack'): string[] {
    if (gateway === 'stripe') {
      return [Currency.USD, Currency.EUR];
    } else if (gateway === 'paypack') {
      return [Currency.RWF];
    }
    return [Currency.RWF, Currency.USD, Currency.EUR];
  }
}