import { IsNumber, IsOptional, IsString, IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStatus, TaskStatus } from '../../../config/constants';

export class CreateWeeklyTrackingDto {
    @ApiProperty({ description: 'Income generated this week', example: 50000 })
    @IsNumber()
    incomeThisWeek: number;

    @ApiProperty({ description: 'Expenses incurred this week', example: 20000 })
    @IsNumber()
    expensesThisWeek: number;

    @ApiProperty({ description: 'Current capital amount', example: 100000 })
    @IsNumber()
    currentCapital: number;

    @ApiProperty({ enum: AttendanceStatus, description: 'Attendance status for the week' })
    @IsEnum(AttendanceStatus)
    attendance: AttendanceStatus;

    @ApiProperty({ description: 'Challenges faced during the week', required: false, example: 'Transport issues' })
    @IsString()
    @IsOptional()
    challenges?: string;

    @ApiProperty({ description: 'Solutions implemented for challenges', required: false, example: 'Found a new supplier' })
    @IsString()
    @IsOptional()
    solutionsImplemented?: string;

    @ApiProperty({ description: 'Task given for the week', required: false, example: 'Visit 5 new clients' })
    @IsString()
    @IsOptional()
    taskGiven?: string;

    @ApiProperty({ enum: TaskStatus, description: 'Completion status of the assigned task', required: false })
    @IsEnum(TaskStatus)
    @IsOptional()
    taskCompletionStatus?: TaskStatus;

    @ApiProperty({
        description: 'Plan for the next week including tasks, goals, and support needed',
        required: false,
        example: {
            tasks: ['Call 10 leads'],
            goals: ['Increase sales by 10%'],
            supportNeeded: ['Mentorship on negotiation']
        }
    })
    @IsArray()
    @IsOptional()
    nextWeekPlan?: {
        tasks: string[];
        goals: string[];
        supportNeeded: string[];
    };
}
