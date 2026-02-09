// src/modules/donations/dto/create-recurring-donation.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum, IsOptional, IsBoolean, IsUUID, Min, IsDate } from 'class-validator';
import { RecurringFrequency, Currency } from '../../../config/constants';

export class CreateRecurringDonationDto {
  @ApiProperty({ description: 'Recurring donation amount', example: 50.00 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: Currency, description: 'Currency', example: Currency.USD })
  @IsNotEmpty()
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({ enum: RecurringFrequency, description: 'Frequency of recurring donation' })
  @IsNotEmpty()
  @IsEnum(RecurringFrequency)
  frequency: RecurringFrequency;

  @ApiProperty({ required: false, description: 'Project ID if applicable' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ required: false, description: 'Program ID if applicable' })
  @IsOptional()
  @IsUUID()
  programId?: string;

  @ApiProperty({ description: 'Payment method ID (from payment gateway)' })
  @IsNotEmpty()
  @IsString()
  paymentMethodId: string;

  @ApiProperty({ description: 'Payment method details' })
  @IsNotEmpty()
  paymentMethodDetails: {
    type: string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };

  @ApiProperty({ description: 'Subscription ID from payment gateway' })
  @IsNotEmpty()
  @IsString()
  subscriptionId: string;

  @ApiProperty({ required: false, description: 'Start date of recurring donation' })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @ApiProperty({ required: false, description: 'End date of recurring donation' })
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @ApiProperty({ required: false, default: false, description: 'Send payment reminders' })
  @IsOptional()
  @IsBoolean()
  sendReminders?: boolean;
}

export class UpdateRecurringDonationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(RecurringFrequency)
  frequency?: RecurringFrequency;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  sendReminders?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  nextChargeDate?: Date;

  @ApiProperty({ required: false, description: 'Cancellation reason if applicable' })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class CancelRecurringDonationDto {
  @ApiProperty({ description: 'Reason for cancellation' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}