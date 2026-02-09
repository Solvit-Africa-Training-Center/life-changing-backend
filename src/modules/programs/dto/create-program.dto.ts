import { ApiPropertyOptional } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsObject,
  IsArray,
  ValidateNested,
  Allow,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

import { ProgramCategory, ProgramStatus } from '../../../config/constants';
import { CreateProjectDTO } from './create-project.dto';

/* ---------------------------------- */
/* Localized Text DTO */
/* ---------------------------------- */
export class LocalizedTextDTO {
  @Allow()
  @IsString()
  en: string;

  @Allow()
  @IsString()
  rw: string;
}

/* ---------------------------------- */
/* SAFE JSON PARSER (Swagger + multipart safe) */
/* ---------------------------------- */
const parseJson = ({ value }) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  // Already parsed
  if (typeof value === 'object') {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    // Handle: "4,8,10"
    if (/^\d+(,\d+)*$/.test(trimmed)) {
      return trimmed.split(',').map(Number);
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      throw new BadRequestException(`Invalid JSON format. Received: ${value}`);
    }
  }

  return value;
};

/* ---------------------------------- */
/* Create Program DTO */
/* ---------------------------------- */
export class CreateProgramDTO {
  @Allow()
  @Transform(parseJson)
  @ValidateNested()
  @Type(() => LocalizedTextDTO)
  name: LocalizedTextDTO;

  @Allow()
  @Transform(parseJson)
  @ValidateNested()
  @Type(() => LocalizedTextDTO)
  description: LocalizedTextDTO;

  @IsEnum(ProgramCategory)
  category: ProgramCategory;

  @Allow()
  @Transform(parseJson)
  @IsArray()
  @IsNumber({}, { each: true })
  sdgAlignment: number[];

  @Allow()
  @Transform(parseJson)
  @IsObject()
  kpiTargets: Record<string, any>;

  @IsDateString()
  startDate: string;

  @Allow()
  @Transform(({ value }) => {
    if (!value || value === '') return undefined;
    return value;
  })
  endDate?: string;

  @Type(() => Number)
  @IsNumber()
  budget: number;

  @IsOptional()
  @Type(() => Number)
  fundsAllocated?: number;

  @IsOptional()
  @Type(() => Number)
  fundsUtilized?: number;

  /* -------- Files (multipart) -------- */
  @Allow()
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  coverImage?: any;

  @Allow()
  @ApiPropertyOptional({ type: 'string', format: 'binary' })
  logo?: any;

  @IsOptional()
  @Type(() => Number)
  sortOrder?: number;

  @Allow()
  @Transform(parseJson)
  metadata?: Record<string, any>;

  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;

  @Allow()
  @Transform(parseJson)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectDTO)
  projects?: CreateProjectDTO[];
}
