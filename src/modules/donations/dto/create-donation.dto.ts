// src/modules/donations/dto/create-donation.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum, IsOptional, IsBoolean, IsUUID, Min } from 'class-validator';
import { DonationType, PaymentMethod, Currency } from '../../../config/constants';

export class CreateDonationDto {
  @ApiProperty({ description: 'Amount to donate', example: 100.00 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: Currency, description: 'Currency of donation', example: Currency.USD })
  @IsNotEmpty()
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({ enum: DonationType, description: 'Type of donation' })
  @IsNotEmpty()
  @IsEnum(DonationType)
  donationType: DonationType;

  @ApiProperty({ required: false, description: 'Project ID if applicable' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiProperty({ required: false, description: 'Program ID if applicable' })
  @IsOptional()
  @IsUUID()
  programId?: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ required: false, description: 'Donor message' })
  @IsOptional()
  @IsString()
  donorMessage?: string;

  @ApiProperty({ required: false, description: 'Make donation anonymous', default: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiProperty({ description: 'Payment method ID (from payment gateway)' })
  @IsNotEmpty()
  @IsString()
  paymentMethodId: string;
}

export class ProcessDonationDto extends CreateDonationDto {
  @ApiProperty({ description: 'Donor ID' })
  @IsNotEmpty()
  @IsUUID()
  donorId: string;
}