// src/modules/beneficiaries/dto/create-goal.dto.ts
import { 
  IsEnum, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  IsString, 
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { GoalType, GoalStatus } from '../../../config/constants';
import { ApiProperty } from '@nestjs/swagger';

class MilestoneDto {
  @ApiProperty({ 
    example: 'Save 20% of the target amount by end of month',
    description: 'Description of the milestone'
  })
  @IsString()
  description: string;

  @ApiProperty({ 
    example: 20000,
    description: 'Target amount to reach for this milestone',
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  targetAmount: number;

  @ApiProperty({ 
    example: '2026-03-31',
    description: 'Target date for completing this milestone'
  })
  @IsDateString()
  targetDate: string;

  @ApiProperty({ 
    example: false,
    default: false,
    description: 'Whether the milestone has been completed'
  })
  @IsOptional()
  completed?: boolean;

  @ApiProperty({ 
    example: '2026-03-30',
    required: false,
    description: 'Date when the milestone was completed'
  })
  @IsOptional()
  @IsDateString()
  completedAt?: string;
}

class ActionPlanDto {
  @ApiProperty({ 
    example: [
      'Research market prices',
      'Create a savings schedule',
      'Open a dedicated savings account',
      'Track expenses weekly'
    ],
    description: 'Step-by-step actions to achieve the goal'
  })
  @IsArray()
  @IsString({ each: true })
  steps: string[];

  @ApiProperty({ 
    example: [
      'Savings account',
      'Budget tracking app',
      'Financial advisor consultation'
    ],
    description: 'Resources needed to achieve the goal'
  })
  @IsArray()
  @IsString({ each: true })
  resourcesNeeded: string[];

  @ApiProperty({ 
    example: '3 months',
    description: 'Expected timeline to complete the goal'
  })
  @IsString()
  timeline: string;
}

export class CreateGoalDto {
  @ApiProperty({ 
    example: 'Save 100,000 RWF to buy sewing machine and materials for my tailoring business',
    description: 'Detailed description of the goal'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ 
    enum: GoalType, 
    example: GoalType.FINANCIAL,
    description: 'Type of goal'
  })
  @IsEnum(GoalType)
  @IsNotEmpty()
  type: GoalType;

  @ApiProperty({ 
    example: 100000,
    description: 'Target amount to achieve (in RWF)',
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  targetAmount: number;

  @ApiProperty({ 
    example: '2026-06-30',
    description: 'Target date for achieving the goal'
  })
  @IsDateString()
  targetDate: string;

  @ApiProperty({ 
    type: [MilestoneDto],
    required: false,
    example: [
      {
        description: 'Save 20,000 RWF for sewing machine deposit',
        targetAmount: 20000,
        targetDate: '2026-03-31'
      },
      {
        description: 'Save 40,000 RWF for materials',
        targetAmount: 40000,
        targetDate: '2026-04-30'
      },
      {
        description: 'Save final 40,000 RWF for remaining costs',
        targetAmount: 40000,
        targetDate: '2026-05-31'
      }
    ],
    description: 'Breakdown of the goal into smaller milestones'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones?: MilestoneDto[];

  @ApiProperty({ 
    example: 'Will save 5,000 RWF per week from business profits',
    required: false,
    description: 'Additional notes about the goal'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    type: ActionPlanDto,
    required: false,
    example: {
      steps: [
        'Calculate weekly profit from tailoring business',
        'Set aside 5,000 RWF every Monday',
        'Track savings in notebook or app',
        'Review progress monthly'
      ],
      resourcesNeeded: [
        'Savings notebook',
        'Lock box or separate bank account',
        'Business profit tracking sheet'
      ],
      timeline: '5 months'
    },
    description: 'Detailed action plan to achieve the goal'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ActionPlanDto)
  actionPlan?: ActionPlanDto;
}

export class UpdateGoalDto {
  @ApiProperty({ 
    example: 'Save 150,000 RWF for advanced sewing machine and bulk materials',
    required: false,
    description: 'Updated description of the goal'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    enum: GoalType, 
    example: GoalType.BUSINESS,
    required: false,
    description: 'Updated type of goal'
  })
  @IsOptional()
  @IsEnum(GoalType)
  type?: GoalType;

  @ApiProperty({ 
    example: 150000,
    required: false,
    description: 'Updated target amount (in RWF)',
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetAmount?: number;

  @ApiProperty({ 
    example: '2026-08-31',
    required: false,
    description: 'Updated target date'
  })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiProperty({ 
    enum: GoalStatus,
    example: GoalStatus.IN_PROGRESS,
    required: false,
    description: 'Current status of the goal'
  })
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @ApiProperty({ 
    example: 45000,
    required: false,
    description: 'Current progress amount',
    minimum: 0,
    maximum: 999999999
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentProgress?: number;

  @ApiProperty({ 
    type: [MilestoneDto],
    required: false,
    example: [
      {
        description: 'Save 30,000 RWF for sewing machine deposit',
        targetAmount: 30000,
        targetDate: '2026-04-15',
        completed: true,
        completedAt: '2026-04-10'
      },
      {
        description: 'Save 60,000 RWF for materials',
        targetAmount: 60000,
        targetDate: '2026-06-30',
        completed: false
      }
    ],
    description: 'Updated milestones'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  milestones?: MilestoneDto[];

  @ApiProperty({ 
    example: 'Now saving 7,000 RWF per week due to increased business',
    required: false,
    description: 'Updated notes'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    type: ActionPlanDto,
    required: false,
    example: {
      steps: [
        'Save 7,000 RWF every Monday',
        'Track savings in dedicated app',
        'Review progress weekly',
        'Adjust savings if needed'
      ],
      resourcesNeeded: [
        'Savings app',
        'Business bank account',
        'Weekly profit reports'
      ],
      timeline: '4 months'
    },
    description: 'Updated action plan'
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ActionPlanDto)
  actionPlan?: ActionPlanDto;
}