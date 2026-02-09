// src/modules/beneficiaries/dto/create-tracking.dto.ts
import { 
  IsEnum, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  IsString, 
  IsDateString,
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus, TaskStatus, UserType } from '../../../config/constants';
import { ApiProperty } from '@nestjs/swagger';

class SalesDataDto {
  @ApiProperty()
  @IsNumber()
  unitsSold: number;

  @ApiProperty()
  @IsNumber()
  averagePrice: number;

  @ApiProperty()
  @IsString()
  bestSellingProduct: string;
}

class NextWeekPlanDto {
  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  tasks: string[];

  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  goals: string[];

  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  supportNeeded: string[];
}

class OfflineDataDto {
  @ApiProperty()
  @IsString()
  deviceInfo: string;

  @ApiProperty()
  @IsObject()
  location: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty()
  @IsDateString()
  timestamp: string;
}

export class CreateTrackingDto {
  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  weekEnding: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  @IsNotEmpty()
  attendance: AttendanceStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  taskGiven?: string;

  @ApiProperty({ enum: TaskStatus, required: false })
  @IsOptional()
  @IsEnum(TaskStatus)
  taskCompletionStatus?: TaskStatus;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  incomeThisWeek: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  expensesThisWeek: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  currentCapital: number;

  @ApiProperty({ type: SalesDataDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => SalesDataDto)
  salesData?: SalesDataDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  challenges?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  solutionsImplemented?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: NextWeekPlanDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => NextWeekPlanDto)
  nextWeekPlan?: NextWeekPlanDto;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  isOfflineSync?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  syncSessionId?: string;

  @ApiProperty({ type: OfflineDataDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => OfflineDataDto)
  offlineData?: OfflineDataDto;
}

export class UpdateTrackingDto extends CreateTrackingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  verificationNotes?: string;
}