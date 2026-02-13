// src/modules/programs/dto/update-project.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDTO } from './create-project.dto';
import { Transform, Type } from 'class-transformer';
import { 
  IsOptional, 
  ValidateNested, 
  IsNumber, 
  IsBoolean
} from 'class-validator';
import { 
  ProjectNameDto, 
  ProjectDescriptionDto, 
  ProjectTimelineDto, 
  ProjectLocationDto, 
  ImpactMetricsDto 
} from './create-project.dto';

export class UpdateProjectDTO extends PartialType(CreateProjectDTO) {
  @IsOptional()
  @ValidateNested()
  @Type(() => ProjectNameDto)
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
  name?: ProjectNameDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProjectDescriptionDto)
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
  description?: ProjectDescriptionDto;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  })
  budgetRequired?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProjectTimelineDto)
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
  timeline?: ProjectTimelineDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProjectLocationDto)
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
  location?: ProjectLocationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImpactMetricsDto)
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
  impactMetrics?: ImpactMetricsDto;

   @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return value;
  })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return value;
  })
  isFeatured?: boolean;
}