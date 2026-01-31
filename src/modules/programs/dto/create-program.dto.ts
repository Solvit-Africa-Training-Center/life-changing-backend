import { IsString, IsOptional, IsEnum, IsNumber, IsDate, IsObject, IsArray } from 'class-validator';
import { ProgramCategory, ProgramStatus } from '../../../config/constants';

export class CreateProgramDTO {
  @IsObject()
  name: {
    en: string;
    rw: string;
  };

  @IsObject()
  description: {
    en: string;
    rw: string;
  };

  @IsEnum(ProgramCategory)
  category: ProgramCategory;

  @IsArray()
  sdgAlignment: number[];

  @IsObject()
  kpiTargets: Record<string, any>;

  @IsDate()
  startDate: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;

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
}
