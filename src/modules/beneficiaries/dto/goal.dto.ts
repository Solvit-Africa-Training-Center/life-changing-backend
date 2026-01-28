import { IsString, IsNumber, IsEnum, IsDateString, IsOptional, IsArray } from 'class-validator';
import { GoalType, GoalStatus } from '../../../config/constants';

export class CreateGoalDto {
    @IsString()
    description: string;

    @IsEnum(GoalType)
    type: GoalType;

    @IsNumber()
    targetAmount: number;

    @IsDateString()
    targetDate: string;

    @IsOptional()
    @IsEnum(GoalStatus)
    status?: GoalStatus;

    @IsOptional()
    @IsArray()
    actionPlan?: {
        steps: string[];
        resourcesNeeded: string[];
        timeline: string;
    };
}

export class UpdateGoalDto {
    @IsOptional()
    @IsNumber()
    currentProgress?: number;

    @IsOptional()
    @IsEnum(GoalStatus)
    status?: GoalStatus;

    @IsOptional()
    @IsString()
    notes?: string;
}
