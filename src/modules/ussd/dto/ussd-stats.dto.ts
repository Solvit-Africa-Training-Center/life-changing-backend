// src/modules/ussd/dto/ussd-stats.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Language, UserType } from 'src/config/constants';

export class UssdStatsDto {
    @ApiProperty({ description: 'Total number of sessions' })
    total: number;

    @ApiProperty({ description: 'Currently active sessions' })
    active: number;

    @ApiProperty({ description: 'Completed sessions' })
    completed: number;

    @ApiProperty({ description: 'Sessions created today' })
    today: number;

    @ApiProperty({ description: 'Sessions this week' })
    thisWeek: number;

    @ApiProperty({ description: 'Sessions this month' })
    thisMonth: number;

    @ApiProperty({ description: 'Average steps per session' })
    averageSteps: number;

    @ApiProperty({ description: 'Average session duration (seconds)' })
    averageDuration: number;

    @ApiProperty({ description: 'Sessions by user type' })
    byUserType: Record<string, number>;

    @ApiProperty({ description: 'Sessions by language' })
    byLanguage: Record<string, number>;

    @ApiProperty({ description: 'Sessions by network' })
    byNetwork: Record<string, number>;

    @ApiProperty({ description: 'Completion rate (%)' })
    completionRate: number;

    @ApiProperty({ description: 'Error rate (%)' })
    errorRate: number;

    @ApiProperty({ description: 'Most used menu states' })
    topMenus: Array<{ menu: string; count: number }>;

    @ApiProperty({ description: 'Peak usage hours' })
    peakHours: Array<{ hour: number; count: number }>;
}

export class UssdSessionDetailsDto {
    @ApiProperty({ description: 'Session ID' })
    id: string;

    @ApiProperty({ description: 'Phone number' })
    phoneNumber: string;

    @ApiProperty({ description: 'Session ID from provider' })
    sessionId: string;

    @ApiProperty({ description: 'Current menu state' })
    menuState: string;

       @ApiProperty({ description: 'User type', enum: UserType, nullable: true }) 
    userType: UserType | null;  

    @ApiProperty({ description: 'Language', enum: Language })  
    language: Language;  

    @ApiProperty({ description: 'Step count' })
    stepCount: number;

    @ApiProperty({ description: 'Is active' })
    isActive: boolean;

    @ApiProperty({ description: 'Created at' })
    createdAt: Date;

    @ApiProperty({ description: 'Last interaction' })
    lastInteraction: Date;

    @ApiProperty({ description: 'Completed at', nullable: true })
    completedAt: Date | null;

    @ApiProperty({ description: 'Session duration (seconds)', nullable: true })
    duration?: number;

    @ApiProperty({ description: 'Metadata' })
    metadata: any;
}

export class UssdStatsQueryDto {
    @ApiProperty({ required: false, description: 'Start date for filtering' })
    startDate?: string;

    @ApiProperty({ required: false, description: 'End date for filtering' })
    endDate?: string;

    @ApiProperty({ required: false, enum: UserType, description: 'Filter by user type' })
    userType?: UserType;

    @ApiProperty({ required: false, enum: Language, description: 'Filter by language' })
    language?: Language;

    @ApiProperty({ required: false, description: 'Filter by network' })
    network?: string;
}