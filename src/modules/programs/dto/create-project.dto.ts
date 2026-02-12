// src/modules/programs/dto/create-project.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsObject, 
  IsNumber, 
  IsOptional, 
  ValidateNested,
  IsNotEmpty,
  IsString,
  IsArray
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ProjectNameDto {
  @ApiProperty({ example: 'Women in Tech Training' })
  @IsString()
  @IsNotEmpty()
  en: string;

  @ApiProperty({ example: 'Amahugurwa yabagore mu ikoranabuhanga' })
  @IsString()
  @IsNotEmpty()
  rw: string;
}

export class ProjectDescriptionDto {
  @ApiProperty({ example: 'Training program for women in technology' })
  @IsString()
  @IsNotEmpty()
  en: string;

  @ApiProperty({ example: 'Porogaramu yamahugurwa yabagore mu ikoranabuhanga' })
  @IsString()
  @IsNotEmpty()
  rw: string;
}

export class MilestoneDto {
  @ApiProperty({ example: '2026-03-31' })
  @IsString()
  date: string;

  @ApiProperty({ example: 'Planning Phase completed' })
  @IsString()
  description: string;
}

export class ProjectTimelineDto {
  @ApiProperty({ example: '2026-03-01' })
  @IsString()
  start: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsString()
  end: string;

  @ApiProperty({ 
    type: [MilestoneDto], 
    required: false,
    example: [
      { date: '2026-03-31', description: 'Planning Phase completed' }
    ]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones?: MilestoneDto[];
}

export class ProjectLocationDto {
  @ApiProperty({ example: ['Kicukiro', 'Gasabo'] })
  @IsArray()
  @IsString({ each: true })
  districts: string[];

  @ApiProperty({ example: ['Gikondo', 'Niboyi'] })
  @IsArray()
  @IsString({ each: true })
  sectors: string[];
}

export class ImpactMetricsDto {
  @ApiProperty({ example: 500 })
  @IsNumber()
  @Transform(({ value }) => {
    if (typeof value === 'string') return parseFloat(value);
    return value;
  })
  beneficiariesTarget: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => {
    if (typeof value === 'string') return parseFloat(value);
    return value;
  })
  beneficiariesReached?: number;

  @ApiProperty({ 
    type: 'array', 
    required: false,
    example: ['jobs created', 'businesses started']
  })
  @IsOptional()
  @IsArray()
  successIndicators?: any[];
}

export class CreateProjectDTO {
  @ApiProperty({ 
    type: () => ProjectNameDto,
    description: 'Project name in English and Kinyarwanda',
    example: { en: 'Women in Tech Training', rw: 'Amahugurwa yabagore mu ikoranabuhanga' }
  })
  @ValidateNested()
  @Type(() => ProjectNameDto)
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
  name: ProjectNameDto;

  @ApiProperty({ 
    type: () => ProjectDescriptionDto,
    description: 'Project description in English and Kinyarwanda',
    example: { en: 'Training program for women in technology', rw: 'Porogaramu yamahugurwa yabagore mu ikoranabuhanga' }
  })
  @ValidateNested()
  @Type(() => ProjectDescriptionDto)
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
  description: ProjectDescriptionDto;

  @ApiProperty({ 
    example: 15000000,
    description: 'Required budget for the project in RWF'
  })
  @IsNumber()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  })
  budgetRequired: number;

  @ApiProperty({ 
    type: () => ProjectTimelineDto,
    description: 'Project timeline with start date, end date, and milestones',
    required: false
  })
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

  @ApiProperty({ 
    type: () => ProjectLocationDto,
    description: 'Project location details',
    required: false
  })
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

  @ApiProperty({ 
    type: () => ImpactMetricsDto,
    description: 'Project impact metrics',
    required: false
  })
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
}