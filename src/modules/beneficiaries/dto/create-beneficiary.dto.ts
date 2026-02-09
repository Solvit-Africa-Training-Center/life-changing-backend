import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsDateString, IsObject, ValidateNested, IsOptional, IsBoolean, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BeneficiaryStatus, TrackingFrequency } from '../../../config/constants';

export class LocationDto {
  @ApiProperty({ example: 'Kicukiro' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ example: 'Gikondo' })
  @IsString()
  @IsNotEmpty()
  sector: string;

  @ApiProperty({ example: 'Nyarugunga' })
  @IsString()
  @IsNotEmpty()
  cell: string;

  @ApiProperty({ example: 'Rukiri I' })
  @IsString()
  @IsNotEmpty()
  village: string;
}

export class CreateBeneficiaryDto {

  @ApiProperty({ example: '1990-01-01' })
  @IsDateString()
  @IsNotEmpty()
  dateOfBirth: string;

  @ApiProperty({ type: LocationDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({
    example: 'program-uuid-here',
    description: 'Optional. If provided, beneficiary will be enrolled in this program.',
    required: false
  })
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiProperty({
    example: '2024-01-01',
    required: false,
    description: 'Optional. Defaults to today if not provided. Cannot be in the future.'
  })
  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0, { message: 'Start capital must be at least 0' })
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