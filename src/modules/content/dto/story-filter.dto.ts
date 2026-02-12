// src/modules/content/dto/story-filter.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsUUID } from 'class-validator';
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
}