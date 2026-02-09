// src/modules/beneficiaries/dto/create-goal.dto.ts
import { 
  IsEnum, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  IsString, 
  IsDateString,
  IsArray,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { GoalType, GoalStatus } from '../../../config/constants';
import { ApiProperty } from '@nestjs/swagger';

class MilestoneDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  targetAmount: number;

  @ApiProperty()
  @IsDateString()
  targetDate: string;

  @ApiProperty({ default: false })
  @IsOptional()
  completed?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  completedAt?: string;
}

class ActionPlanDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  steps: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  resourcesNeeded: string[];

  @ApiProperty()
  @IsString()
  timeline: string;
}

export class CreateGoalDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: GoalType })
  @IsEnum(GoalType)
  @IsNotEmpty()
  type: GoalType;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  targetAmount: number;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  targetDate: string;

  @ApiProperty({ type: [MilestoneDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones?: MilestoneDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: ActionPlanDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ActionPlanDto)
  actionPlan?: ActionPlanDto;
}

export class UpdateGoalDto extends CreateGoalDto {
  @ApiProperty({ enum: GoalStatus, required: false })
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  currentProgress?: number;
}