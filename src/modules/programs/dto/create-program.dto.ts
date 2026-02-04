import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsObject,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { ProgramCategory, ProgramStatus } from '../../../config/constants';
import { CreateProjectDTO } from './create-project.dto';

// ⭐ Reusable multilingual DTO
export class LocalizedTextDTO {
  @IsString()
  en: string;

  @IsString()
  rw: string;
}

export class CreateProgramDTO {
  // ⭐ Multilingual name validation
  @ValidateNested()
  @Type(() => LocalizedTextDTO)
  name: LocalizedTextDTO;

  // ⭐ Multilingual description validation
  @ValidateNested()
  @Type(() => LocalizedTextDTO)
  description: LocalizedTextDTO;

  @IsEnum(ProgramCategory)
  category: ProgramCategory;

  @IsArray()
  sdgAlignment: number[];

  @IsObject()
  kpiTargets: Record<string, any>;

  // ⭐ JSON friendly date validation
  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsNumber()
  budget: number;

  @IsOptional()
  @IsNumber()
  fundsAllocated?: number;

  @IsOptional()
  @IsNumber()
  fundsUtilized?: number;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;

  // ⭐ PROGRAM → PROJECT LINKING
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectDTO)
  projects?: CreateProjectDTO[];
}
