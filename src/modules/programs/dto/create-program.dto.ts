// import { ApiPropertyOptional } from '@nestjs/swagger';
// import { BadRequestException } from '@nestjs/common';
// import {
//   IsString,
//   IsOptional,
//   IsEnum,
//   IsNumber,
//   IsDateString,
//   IsObject,
//   IsArray,
//   ValidateNested,
//   Allow,
// } from 'class-validator';
// import { Type, Transform } from 'class-transformer';

// import { ProgramCategory, ProgramStatus } from '../../../config/constants';
// import { CreateProjectDTO } from './create-project.dto';

// /* ---------------------------------- */
// /* Localized Text DTO */
// /* ---------------------------------- */
// export class LocalizedTextDTO {
//   @Allow()
//   @IsString()
//   en: string;

//   @Allow()
//   @IsString()
//   rw: string;
// }

// /* ---------------------------------- */
// /* SAFE JSON PARSER (Swagger + multipart safe) */
// /* ---------------------------------- */
// const parseJson = ({ value }) => {
//   if (value === undefined || value === null || value === '') {
//     return undefined;
//   }

//   // Already parsed
//   if (typeof value === 'object') {
//     return value;
//   }

//   if (typeof value === 'string') {
//     const trimmed = value.trim();

//     // Handle: "4,8,10"
//     if (/^\d+(,\d+)*$/.test(trimmed)) {
//       return trimmed.split(',').map(Number);
//     }

//     try {
//       return JSON.parse(trimmed);
//     } catch {
//       throw new BadRequestException(`Invalid JSON format. Received: ${value}`);
//     }
//   }

//   return value;
// };

// /* ---------------------------------- */
// /* Create Program DTO */
// /* ---------------------------------- */
// export class CreateProgramDTO {
//   @Allow()
//   @Transform(parseJson)
//   @ValidateNested()
//   @Type(() => LocalizedTextDTO)
//   name: LocalizedTextDTO;

//   @Allow()
//   @Transform(parseJson)
//   @ValidateNested()
//   @Type(() => LocalizedTextDTO)
//   description: LocalizedTextDTO;

//   @IsEnum(ProgramCategory)
//   category: ProgramCategory;

//   @Allow()
//   @Transform(parseJson)
//   @IsArray()
//   @IsNumber({}, { each: true })
//   sdgAlignment: number[];

//   @Allow()
//   @Transform(parseJson)
//   @IsObject()
//   kpiTargets: Record<string, any>;

//   @IsDateString()
//   startDate: string;

//   @Allow()
//   @Transform(({ value }) => {
//     if (!value || value === '') return undefined;
//     return value;
//   })
//   endDate?: string;

//   @Type(() => Number)
//   @IsNumber()
//   budget: number;

//   @IsOptional()
//   @Type(() => Number)
//   fundsAllocated?: number;

//   @IsOptional()
//   @Type(() => Number)
//   fundsUtilized?: number;

//   /* -------- Files (multipart) -------- */
//   @Allow()
//   @ApiPropertyOptional({ type: 'string', format: 'binary' })
//   coverImage?: any;

//   @Allow()
//   @ApiPropertyOptional({ type: 'string', format: 'binary' })
//   logo?: any;

//   @IsOptional()
//   @Type(() => Number)
//   sortOrder?: number;

//   @Allow()
//   @Transform(parseJson)
//   metadata?: Record<string, any>;

//   @IsOptional()
//   @IsEnum(ProgramStatus)
//   status?: ProgramStatus;

//   @Allow()
//   @Transform(parseJson)
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => CreateProjectDTO)
//   projects?: CreateProjectDTO[];
// }


// src/modules/programs/dto/create-program.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, IsNumber, IsDateString, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProgramCategory, ProgramStatus } from '../../../config/constants';

class NameDto {
  @ApiProperty({ example: 'Women Entrepreneurship Program' })
  @IsString()
  en: string;

  @ApiProperty({ example: 'Porogaramu yubucuruzi bwabagore' })
  @IsString()
  rw: string;
}

class DescriptionDto {
  @ApiProperty({ example: 'Empowering women through business training' })
  @IsString()
  en: string;

  @ApiProperty({ example: 'Gutera imbaraga abagore binyuze mu biganiro byubucuruzi' })
  @IsString()
  rw: string;
}

class ProjectDto {
  @ApiProperty({ type: NameDto })
  @ValidateNested()
  @Type(() => NameDto)
  name: NameDto;

  @ApiProperty({ type: DescriptionDto })
  @ValidateNested()
  @Type(() => DescriptionDto)
  description: DescriptionDto;

  @ApiProperty({ example: 10000000 })
  @IsNumber()
  budgetRequired: number;

  @ApiProperty({ 
    example: { 
      start: '2024-01-01', 
      end: '2024-12-31',
      milestones: [
        { name: 'Planning Phase', date: '2024-01-31' },
        { name: 'Implementation', date: '2024-06-30' }
      ]
    } 
  })
  @IsObject()
  timeline: any;

  @ApiProperty({ 
    example: { 
      districts: ['Kicukiro', 'Gasabo'], 
      sectors: ['Gikondo', 'Niboyi'] 
    } 
  })
  @IsObject()
  location: any;
}

export class CreateProgramDTO {
  @ApiProperty({ type: NameDto })
  @ValidateNested()
  @Type(() => NameDto)
  name: NameDto;

  @ApiProperty({ type: DescriptionDto })
  @ValidateNested()
  @Type(() => DescriptionDto)
  description: DescriptionDto;

  @ApiProperty({ enum: ProgramCategory, example: ProgramCategory.ENTREPRENEURSHIP })
  @IsEnum(ProgramCategory)
  category: ProgramCategory;

  @ApiProperty({ example: [1, 5, 8] })
  @IsArray()
  sdgAlignment: number[];

  @ApiProperty({ example: { beneficiaries: 100, capitalGrowth: 50 } })
  @IsObject()
  kpiTargets: Record<string, any>;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-12-31', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: 50000000 })
  @IsNumber()
  budget: number;

  @ApiProperty({ enum: ProgramStatus, example: ProgramStatus.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;

  @ApiProperty({ type: [ProjectDto], required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProjectDto)
  projects?: ProjectDto[];
}