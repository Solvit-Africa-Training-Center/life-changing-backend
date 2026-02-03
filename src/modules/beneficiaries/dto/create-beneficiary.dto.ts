import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsDateString, IsObject, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { BeneficiaryStatus, TrackingFrequency } from '../../../config/constants';

export class LocationDto {
  @ApiProperty({ example: 'Kicukiro' })
  @IsString()
  district: string;

  @ApiProperty({ example: 'Gikondo' })
  @IsString()
  sector: string;

  @ApiProperty({ example: 'Nyarugunga' })
  @IsString()
  cell: string;

  @ApiProperty({ example: 'Rukiri I' })
  @IsString()
  village: string;
}

export class CreateBeneficiaryDto {
  @ApiProperty({ example: 'Alice Mukamana' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ type: LocationDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({ example: 'program-uuid-here' })
  @IsString()
  programId: string;

  @ApiProperty({ enum: BeneficiaryStatus, example: BeneficiaryStatus.ACTIVE })
  @IsEnum(BeneficiaryStatus)
  status: BeneficiaryStatus;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  enrollmentDate: string;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  startCapital: number;

  @ApiProperty({ example: 'Tailoring' })
  @IsString()
  businessType: string;

  @ApiProperty({ enum: TrackingFrequency, example: TrackingFrequency.WEEKLY })
  @IsEnum(TrackingFrequency)
  trackingFrequency: TrackingFrequency;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  requiresSpecialAttention?: boolean;
}