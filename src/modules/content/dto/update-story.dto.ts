// src/modules/content/dto/update-story.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateStoryDTO, StoryTitleDto, StoryContentDto, StoryMetadataDto } from './create-story.dto';
import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  ValidateNested,
  IsString,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { Language, UserType } from '../../../config/constants';

export class UpdateStoryDTO extends PartialType(CreateStoryDTO) {
  @IsOptional()
  @ValidateNested()
  @Type(() => StoryTitleDto)
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
  title?: StoryTitleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => StoryContentDto)
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
  content?: StoryContentDto;

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsOptional()
  @IsEnum(UserType)
  authorRole?: UserType;

  @IsOptional()
  @IsUUID()
  programId?: string;

  @IsOptional()
  @IsUUID()
  beneficiaryId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPublished?: boolean;

  @IsOptional()
  @IsDateString()
  publishedDate?: string;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;

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