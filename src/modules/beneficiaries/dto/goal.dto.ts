import { IsString, IsNumber, IsEnum, IsDateString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GoalType, GoalStatus } from '../../../config/constants';


export class CreateGoalDto {
    @ApiProperty({ description: 'Description of the goal', example: 'Buy a new sewing machine' })
    @IsString()
    description: string;

    @ApiProperty({ enum: GoalType, description: 'Type of the goal' })
    @IsEnum(GoalType)
    type: GoalType;

    @ApiProperty({ description: 'Target amount for the goal', example: 500000 })
    @IsNumber()
    targetAmount: number;

    @ApiProperty({ description: 'Target date for achieving the goal' })
    @IsDateString()
    targetDate: string;

    @ApiProperty({ enum: GoalStatus, description: 'Status of the goal', required: false, default: GoalStatus.NOT_STARTED })
    @IsOptional()
    @IsEnum(GoalStatus)
    status?: GoalStatus;

    @ApiProperty({
        description: 'Action plan to achieve the goal',
        required: false,
        example: {
            steps: ['Save 10% of income', 'Look for suppliers'],
            resourcesNeeded: ['Money'],
            timeline: '3 months'
        }
    })
    @IsOptional()
    @IsArray()
    actionPlan?: {
        steps: string[];
        resourcesNeeded: string[];
        timeline: string;
    };
}

export class UpdateGoalDto {
    @ApiProperty({ description: 'Current progress amount', required: false, example: 50000 })
    @IsOptional()
    @IsNumber()
    currentProgress?: number;

    @ApiProperty({ enum: GoalStatus, description: 'Status of the goal', required: false })
    @IsOptional()
    @IsEnum(GoalStatus)
    status?: GoalStatus;

    @ApiProperty({ description: 'Notes on the goal progress', required: false, example: 'Halfway there!' })
    @IsOptional()
    @IsString()
    notes?: string;
}
