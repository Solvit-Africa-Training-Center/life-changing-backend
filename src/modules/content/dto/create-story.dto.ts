// src/modules/content/dto/create-story.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsUUID,
  IsObject,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Language, UserType } from '../../../config/constants';

export class StoryTitleDto {
  @ApiProperty({ example: 'How Women Entrepreneurship Changed My Life' })
  @IsString()
  @IsNotEmpty()
  en: string;

  @ApiProperty({ example: 'Uburyo Ubucuruzi bwAbagore bwahinduye ubuzima bwanjye' })
  @IsString()
  @IsNotEmpty()
  rw: string;
}

export class StoryContentDto {
  @ApiProperty({ example: 'Marie started her business with just 50,000 RWF...' })
  @IsString()
  @IsNotEmpty()
  en: string;

  @ApiProperty({ example: 'Marie yatangiye ubucuruzi bwe afite 50,000 RWF gusa...' })
  @IsString()
  @IsNotEmpty()
  rw: string;
}

export class StoryMetadataDto {
  @ApiProperty({ example: ['women-empowerment', 'entrepreneurship', 'success-story'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        // Handle comma-separated values
        if (value.includes(',')) {
          return value.split(',').map(tag => tag.trim());
        }
        return [value];
      }
    }
    return value;
  })
  tags?: string[];

  @ApiProperty({ example: 'Kigali, Rwanda', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: 120, description: 'Reading time in seconds', required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseInt(value, 10);
    }
    return value;
  })
  duration?: number;
}

export class CreateStoryDTO {
  @ApiProperty({
    type: () => StoryTitleDto,
    description: 'Story title in English and Kinyarwanda',
    example: {
      en: 'How Women Entrepreneurship Changed My Life',
      rw: 'Uburyo Ubucuruzi bwAbagore bwahinduye ubuzima bwanjye'
    }
  })
  @ValidateNested()
  @Type(() => StoryTitleDto)
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  title: StoryTitleDto;

  @ApiProperty({
    type: () => StoryContentDto,
    description: 'Story content in English and Kinyarwanda',
    example: {
      en: 'Marie started her business with just 50,000 RWF...',
      rw: 'Marie yatangiye ubucuruzi bwe afite 50,000 RWF gusa...'
    }
  })
  @ValidateNested()
  @Type(() => StoryContentDto)
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  content: StoryContentDto;

  @ApiProperty({ example: 'Marie Uwase' })
  @IsString()
  @IsNotEmpty()
  authorName: string;

  @ApiProperty({ enum: UserType, example: 'beneficiary' })
  @IsEnum(UserType)
  authorRole: UserType;

  @ApiProperty({ required: false, example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  programId?: string;

  @ApiProperty({ required: false, example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  beneficiaryId?: string;

  @ApiProperty({ required: false, example: '2026-03-15' })
  @IsOptional()
  @IsDateString()
  publishedDate?: string;

  @ApiProperty({ enum: Language, default: Language.EN, example: 'en' })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ApiProperty({ default: false, example: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isFeatured?: boolean;

  @ApiProperty({ default: true, example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPublished?: boolean;

  @ApiProperty({
    type: () => StoryMetadataDto,
    required: false,
    description: 'Additional metadata for the story'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StoryMetadataDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  metadata?: StoryMetadataDto;
}