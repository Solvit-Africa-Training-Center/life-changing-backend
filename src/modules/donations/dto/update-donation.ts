// src/modules/donations/dto/update-donation.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean, IsDate } from 'class-validator';
import { PaymentStatus } from '../../../config/constants';
import { PartialType } from '@nestjs/swagger';
import { CreateDonationDto } from './create-donation.dto';

export class UpdateDonationDto extends PartialType(CreateDonationDto) {
  @ApiProperty({ enum: PaymentStatus, required: false })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  receiptSent?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  receiptSentAt?: Date;
}