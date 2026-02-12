// src/modules/programs/dto/create-program.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, IsEnum, IsArray, IsNumber, IsDateString, 
  IsOptional, IsObject, ValidateNested, IsNotEmpty 
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProgramCategory, ProgramStatus } from '../../../config/constants';

// ALL nested classes MUST be exported!
export class NameDto {
  @ApiProperty({ example: 'Women Entrepreneurship Program' })
  @IsString()
  @IsNotEmpty()
  en: string;

  @ApiProperty({ example: 'Porogaramu yubucuruzi bwabagore' })
  @IsString()
  @IsNotEmpty()
  rw: string;
}

export class DescriptionDto {
  @ApiProperty({ example: 'Empowering women through business training' })
  @IsString()
  @IsNotEmpty()
  en: string;

  @ApiProperty({ example: 'Gutera imbaraga abagore binyuze mu biganiro byubucuruzi' })
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

export class TimelineDto {
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
      { date: '2026-03-31', description: 'Planning Phase completed' },
      { date: '2026-06-30', description: 'Implementation started' }
    ]
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones?: MilestoneDto[];
}

export class LocationDto {
  @ApiProperty({ example: ['Kicukiro', 'Gasabo'] })
  @IsArray()
  @IsString({ each: true })
  districts: string[];

  @ApiProperty({ example: ['Gikondo', 'Niboyi'] })
  @IsArray()
  @IsString({ each: true })
  sectors: string[];
}

export class ProjectDto {
  @ApiProperty({ type: () => NameDto })
  @ValidateNested()
  @Type(() => NameDto)
  @IsNotEmpty()
  name: NameDto;

  @ApiProperty({ type: () => DescriptionDto })
  @ValidateNested()
  @Type(() => DescriptionDto)
  @IsNotEmpty()
  description: DescriptionDto;

  @ApiProperty({ example: 10000000 })
  @IsNumber()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  })
  budgetRequired: number;

  @ApiProperty({ type: () => TimelineDto })
  @ValidateNested()
  @Type(() => TimelineDto)
  @IsNotEmpty()
  timeline: TimelineDto;

  @ApiProperty({ type: () => LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty()
  location: LocationDto;
}

export class CreateProgramDTO {
  @ApiProperty({ 
    type: () => NameDto,
    description: 'Program name in English and Kinyarwanda',
    example: { en: 'Women Entrepreneurship Program', rw: 'Porogaramu yubucuruzi bwabagore' }
  })
  @ValidateNested()
  @Type(() => NameDto)
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
  name: NameDto;

  @ApiProperty({ 
    type: () => DescriptionDto,
    description: 'Program description in English and Kinyarwanda',
    example: { en: 'Empowering women through business training', rw: 'Gutera imbaraga abagore' }
  })
  @ValidateNested()
  @Type(() => DescriptionDto)
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
  description: DescriptionDto;

  // ✅ ADD THIS - Category field
  @ApiProperty({ 
    enum: ProgramCategory, 
    example: 'entrepreneurship',
    description: 'Program category'
  })
  @IsEnum(ProgramCategory)
  @IsNotEmpty()
  category: ProgramCategory;

  @ApiProperty({ 
    type: [Number],
    example: [1, 5, 8],
    description: 'Array of SDG alignment numbers (1-17)'
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        // Handle comma-separated values
        if (value.includes(',')) {
          return value.split(',').map(Number);
        }
        return [Number(value)];
      }
    }
    return value;
  })
  sdgAlignment: number[];

  @ApiProperty({ 
    type: Object,
    example: { beneficiaries: 100, capitalGrowth: 50 },
    description: 'Key Performance Indicator targets',
    additionalProperties: true
  })
  @IsObject()
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
  kpiTargets: Record<string, any>;

  // ✅ ADD THIS - Start Date field
  @ApiProperty({ 
    example: '2026-03-01',
    description: 'Program start date (ISO format)'
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  // ✅ ADD THIS - End Date field (optional)
  @ApiProperty({ 
    example: '2026-12-31', 
    required: false,
    description: 'Program end date (ISO format)'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // ✅ ADD THIS - Budget field
  @ApiProperty({ 
    example: 50000000,
    description: 'Total program budget in RWF'
  })
  @IsNumber()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  })
  budget: number;

  // ✅ ADD THIS - Status field (optional)
  @ApiProperty({ 
    enum: ProgramStatus, 
    example: 'active', 
    required: false,
    description: 'Program status'
  })
  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;

  @ApiProperty({ 
    type: [ProjectDto], 
    required: false,
    default: [],
    description: 'Array of projects under this program'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value;
  })
  projects?: ProjectDto[];
}
