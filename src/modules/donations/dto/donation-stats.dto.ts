// src/modules/donations/dto/donation-stats.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsArray, IsObject } from 'class-validator';

export class DonationStatsDto {
  @ApiProperty()
  @IsNumber()
  totalDonations: number;

  @ApiProperty()
  @IsNumber()
  totalAmount: number;

  @ApiProperty()
  @IsNumber()
  recurringDonations: number;

  @ApiProperty()
  @IsArray()
  byType: Array<{ type: string; count: number; amount: number }>;

  @ApiProperty()
  @IsArray()
  byProgram: Array<{ program: string; count: number; amount: number }>;

  @ApiProperty()
  @IsArray()
  byMonth: Array<{ month: string; count: number; amount: number }>;

  @ApiProperty()
  @IsObject()
  averageDonation: {
    oneTime: number;
    recurring: number;
    overall: number;
  };
}

export class RecurringDonationStatsDto {
  @ApiProperty()
  @IsNumber()
  totalActive: number;

  @ApiProperty()
  @IsNumber()
  totalPaused: number;

  @ApiProperty()
  @IsNumber()
  totalCancelled: number;

  @ApiProperty()
  @IsNumber()
  monthlyRecurringRevenue: number;

  @ApiProperty()
  @IsArray()
  byFrequency: Array<{ frequency: string; count: number; amount: number }>;

  @ApiProperty()
  @IsArray()
  upcomingCharges: Array<{ count: number; amount: number }>;
}