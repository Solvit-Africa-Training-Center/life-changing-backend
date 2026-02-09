import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsBoolean, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Currency, ReceiptPreference } from '../../../config/constants';

export class CommunicationPreferencesDto {
  @ApiProperty({ default: true })
  @IsBoolean()
  email: boolean;

  @ApiProperty({ default: true })
  @IsBoolean()
  sms: boolean;
}

export class CreateDonorDto {
  @ApiProperty({ example: 'Rwanda' })
  @IsString()
  country: string;

  @ApiProperty({ enum: Currency, example: Currency.RWF })
  @IsEnum(Currency)
  preferredCurrency: Currency;

  @ApiProperty({ type: CommunicationPreferencesDto })
  @IsObject()
  @ValidateNested()
  @Type(() => CommunicationPreferencesDto)
  communicationPreferences: CommunicationPreferencesDto;

  @ApiProperty({ enum: ReceiptPreference, example: ReceiptPreference.EMAIL })
  @IsEnum(ReceiptPreference)
  receiptPreference: ReceiptPreference;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  anonymityPreference?: boolean;

  @ApiProperty({ default: true, required: false })
  @IsOptional()
  @IsBoolean()
  receiveNewsletter?: boolean;
}

