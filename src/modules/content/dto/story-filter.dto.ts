// src/modules/content/dto/story-filter.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsUUID, IsDateString, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { Language } from '../../../config/constants';

export class StoryFilterDto {
  @ApiProperty({ required: false, enum: Language })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ApiProperty({ required: false, type: Boolean })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPublished?: boolean;

  @ApiProperty({ required: false, type: Boolean })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isFeatured?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  programId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  beneficiaryId?: string;

  @ApiProperty({ required: false, description: 'Filter stories from this date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({ required: false, description: 'Filter stories to this date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiProperty({ required: false, description: 'Search by author name' })
  @IsOptional()
  @IsString()
  authorName?: string;
}