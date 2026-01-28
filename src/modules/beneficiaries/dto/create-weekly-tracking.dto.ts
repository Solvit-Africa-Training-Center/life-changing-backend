import { IsNumber, IsOptional, IsString, IsEnum, IsArray } from 'class-validator';
import { AttendanceStatus, TaskStatus } from '../../../config/constants';

export class CreateWeeklyTrackingDto {
    @IsNumber()
    incomeThisWeek: number;

    @IsNumber()
    expensesThisWeek: number;

    @IsNumber()
    currentCapital: number;

    @IsEnum(AttendanceStatus)
    attendance: AttendanceStatus;

    @IsString()
    @IsOptional()
    challenges?: string;

    @IsString()
    @IsOptional()
    solutionsImplemented?: string;

    @IsString()
    @IsOptional()
    taskGiven?: string;

    @IsEnum(TaskStatus)
    @IsOptional()
    taskCompletionStatus?: TaskStatus;

    @IsArray()
    @IsOptional()
    nextWeekPlan?: {
        tasks: string[];
        goals: string[];
        supportNeeded: string[];
    };
}
