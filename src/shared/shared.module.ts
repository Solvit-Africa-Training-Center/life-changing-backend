// src/shared/shared.module.ts
import { Global, Module } from '@nestjs/common';
import { CloudinaryService } from './services/cloudinary.service';
import { Helpers } from './utils/helpers';
import { StripeService } from './services/stripe.service';
import { PaypackService } from './services/paypack.service';
import { CurrencyService } from './services/currency.service';

@Global() // Makes services available globally
@Module({
  providers: [
    CloudinaryService, 
    StripeService,
    PaypackService,
    CurrencyService,
    Helpers],
  exports: [
    CloudinaryService, 
    StripeService,
    PaypackService,
    CurrencyService,
    Helpers],
})
export class SharedModule {}
