// src/modules/ussd/ussd-stats.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, Not, LessThan, MoreThan } from 'typeorm';
import { UssdSession } from '../entities/ussd-session.entity';
import {
    UssdStatsDto,
    UssdSessionDetailsDto,
    UssdStatsQueryDto
} from '../dto/ussd-stats.dto';
import { UserType } from 'src/config/constants';


@Injectable()
export class UssdStatsService {
    private readonly logger = new Logger(UssdStatsService.name);

    constructor(
        @InjectRepository(UssdSession)
        private ussdSessionRepository: Repository<UssdSession>,
    ) { }

    async getStatistics(query: UssdStatsQueryDto): Promise<UssdStatsDto> {
        const { startDate, endDate, userType, language, network } = query;

        // Build date filter
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                createdAt: Between(new Date(startDate), new Date(endDate))
            };
        }

        // Build additional filters
        const filters = {
            ...dateFilter,
            ...(userType && { userType }),
            ...(language && { language }),
            ...(network && { metadata: { network } }),
        };

        // Get current date ranges
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        // Run parallel queries for efficiency
        const [
            total,
            active,
            completed,
            todayCount,
            thisWeekCount,
            thisMonthCount,
            avgSteps,
            avgDuration,
            byUserType,
            byLanguage,
            byNetwork,
            topMenus,
            peakHours,
            errorStats
        ] = await Promise.all([
            // Total sessions
            this.ussdSessionRepository.count({ where: filters }),

            // Active sessions
            this.ussdSessionRepository.count({
                where: { ...filters, isActive: true }
            }),

            // Completed sessions
            this.ussdSessionRepository.count({
                where: { ...filters, completedAt: Not(IsNull()) }
            }),

            // Today's sessions
            this.ussdSessionRepository.count({
                where: { ...filters, createdAt: MoreThan(today) }
            }),

            // This week's sessions
            this.ussdSessionRepository.count({
                where: { ...filters, createdAt: MoreThan(weekAgo) }
            }),

            // This month's sessions
            this.ussdSessionRepository.count({
                where: { ...filters, createdAt: MoreThan(monthAgo) }
            }),

            // Average steps
            this.ussdSessionRepository
                .createQueryBuilder('session')
                .select('AVG(session.stepCount)', 'avg')
                .where(filters)
                .getRawOne(),

            // Average duration (for completed sessions)
            this.ussdSessionRepository
                .createQueryBuilder('session')
                .select('AVG(EXTRACT(EPOCH FROM (session.completedAt - session.createdAt)))', 'avg')
                .where({ ...filters, completedAt: Not(IsNull()) })
                .getRawOne(),

            // Sessions by user type
            this.ussdSessionRepository
                .createQueryBuilder('session')
                .select('session.userType, COUNT(*) as count')
                .where(filters)
                .groupBy('session.userType')
                .getRawMany(),

            // Sessions by language
            this.ussdSessionRepository
                .createQueryBuilder('session')
                .select('session.language, COUNT(*) as count')
                .where(filters)
                .groupBy('session.language')
                .getRawMany(),

            // Sessions by network
            this.ussdSessionRepository
                .createQueryBuilder('session')
                .select("session.metadata->>'network' as network, COUNT(*) as count")
                .where(filters)
                .groupBy("session.metadata->>'network'")
                .getRawMany(),

            // Top menus
            this.ussdSessionRepository
                .createQueryBuilder('session')
                .select('session.menuState, COUNT(*) as count')
                .where(filters)
                .groupBy('session.menuState')
                .orderBy('count', 'DESC')
                .limit(10)
                .getRawMany(),

            // Peak hours
            this.ussdSessionRepository
                .createQueryBuilder('session')
                .select('EXTRACT(HOUR FROM session.createdAt) as hour, COUNT(*) as count')
                .where(filters)
                .groupBy('hour')
                .orderBy('hour')
                .getRawMany(),

            // Error statistics
            this.ussdSessionRepository
                .createQueryBuilder('session')
                .select('AVG(CAST(session.metadata->>\'errorCount\' as INTEGER)) as avgErrors')
                .addSelect('SUM(CAST(session.metadata->>\'errorCount\' as INTEGER)) as totalErrors')
                .where(filters)
                .getRawOne()
        ]);

        // Calculate completion rate
        const completionRate = total > 0 ? (completed / total) * 100 : 0;

        // Calculate error rate (sessions with errors)
        const sessionsWithErrors = errorStats?.totalErrors || 0;
        const errorRate = total > 0 ? (sessionsWithErrors / total) * 100 : 0;

        return {
            total,
            active,
            completed,
            today: todayCount,
            thisWeek: thisWeekCount,
            thisMonth: thisMonthCount,
            averageSteps: Math.round(avgSteps?.avg || 0),
            averageDuration: Math.round(avgDuration?.avg || 0),
            byUserType: this.arrayToObject(byUserType, 'userType', 'count'),
            byLanguage: this.arrayToObject(byLanguage, 'language', 'count'),
            byNetwork: this.arrayToObject(byNetwork, 'network', 'count'),
            topMenus: topMenus.map(item => ({ menu: item.menuState, count: parseInt(item.count) })),
            peakHours: peakHours.map(item => ({ hour: parseInt(item.hour), count: parseInt(item.count) })),
            completionRate: parseFloat(completionRate.toFixed(2)),
            errorRate: parseFloat(errorRate.toFixed(2)),
        };
    }

    async getSessions(params: {
        page: number;
        limit: number;
        isActive?: boolean;
        userType?: UserType;
    }): Promise<{ data: UssdSessionDetailsDto[]; total: number; page: number; limit: number }> {
        const { page, limit, isActive, userType } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (isActive !== undefined) where.isActive = isActive;
        if (userType) where.userType = userType;

        const [sessions, total] = await this.ussdSessionRepository.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });

        const data = sessions.map(session => this.mapToDetailsDto(session));

        return {
            data,
            total,
            page,
            limit,
        };
    }

    async getSessionDetails(id: string): Promise<UssdSessionDetailsDto> {
        const session = await this.ussdSessionRepository.findOne({
            where: { id }
        });

        if (!session) {
            throw new NotFoundException(`Session with ID ${id} not found`);
        }

        return this.mapToDetailsDto(session);
    }

    async getSessionsByPhone(
        phoneNumber: string,
        pagination: { page: number; limit: number }
    ): Promise<{ data: UssdSessionDetailsDto[]; total: number; page: number; limit: number }> {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;

        const [sessions, total] = await this.ussdSessionRepository.findAndCount({
            where: { phoneNumber },
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });

        const data = sessions.map(session => this.mapToDetailsDto(session));

        return {
            data,
            total,
            page,
            limit,
        };
    }

    async getDailySummary(days: number): Promise<any[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const results = await this.ussdSessionRepository
            .createQueryBuilder('session')
            .select('DATE(session.createdAt) as date')
            .addSelect('COUNT(*) as total')
            .addSelect('SUM(CASE WHEN session.isActive = true THEN 1 ELSE 0 END) as active')
            .addSelect('SUM(CASE WHEN session.completedAt IS NOT NULL THEN 1 ELSE 0 END) as completed')
            .addSelect('AVG(session.stepCount) as avgSteps')
            .where('session.createdAt >= :startDate', { startDate })
            .groupBy('DATE(session.createdAt)')
            .orderBy('date', 'DESC')
            .getRawMany();

        return results;
    }

    async getMenuStatistics(): Promise<any> {
        const totalSessions = await this.ussdSessionRepository.count();

        const menuStats = await this.ussdSessionRepository
            .createQueryBuilder('session')
            .select('session.menuState', 'menuState')
            .addSelect('COUNT(*)', 'count')
            .addSelect('COUNT(*) * 100.0 / :total', 'percentage')
            .setParameter('total', totalSessions)
            .groupBy('session.menuState')
            .orderBy('count', 'DESC')
            .getRawMany()

        // Calculate average time spent in each menu
        const menuDurations = await this.ussdSessionRepository
            .createQueryBuilder('session')
            .select("session.data->>'currentMenu'", 'menu')
            .addSelect('AVG(EXTRACT(EPOCH FROM (session.lastInteraction - session.createdAt)))', 'avgDuration')
            .groupBy("session.data->>'currentMenu'")
            .getRawMany();

        return {
            menuStats,
            menuDurations,
        };
    }

    async exportSessionsToCsv(query: UssdStatsQueryDto): Promise<string> {
        const sessions = await this.ussdSessionRepository.find({
            where: {
                ...(query.startDate && query.endDate && {
                    createdAt: Between(new Date(query.startDate), new Date(query.endDate))
                }),
                ...(query.userType && { userType: query.userType }),
                ...(query.language && { language: query.language }),
            },
            order: { createdAt: 'DESC' },
        });

        // Create CSV header
        const headers = [
            'Session ID',
            'Phone Number',
            'User Type',
            'Language',
            'Menu State',
            'Step Count',
            'Is Active',
            'Created At',
            'Last Interaction',
            'Completed At',
            'Duration (seconds)',
            'Network',
            'Error Count'
        ];

        const rows = sessions.map(session => {
            const duration = session.completedAt
                ? Math.round((session.completedAt.getTime() - session.createdAt.getTime()) / 1000)
                : '';

            return [
                session.sessionId,
                session.phoneNumber,
                session.userType || '',
                session.language,
                session.menuState,
                session.stepCount,
                session.isActive ? 'Yes' : 'No',
                session.createdAt.toISOString(),
                session.lastInteraction.toISOString(),
                session.completedAt?.toISOString() || '',
                duration,
                session.metadata?.network || '',
                session.metadata?.errorCount || 0
            ].join(',');
        });

        return [headers.join(','), ...rows].join('\n');
    }

    private mapToDetailsDto(session: UssdSession): UssdSessionDetailsDto {
        const duration = session.completedAt
            ? Math.round((session.completedAt.getTime() - session.createdAt.getTime()) / 1000)
            : undefined;

        return {
            id: session.id,
            phoneNumber: session.phoneNumber,
            sessionId: session.sessionId,
            menuState: session.menuState,
            userType: session.userType,
            language: session.language,
            stepCount: session.stepCount,
            isActive: session.isActive,
            createdAt: session.createdAt,
            lastInteraction: session.lastInteraction,
            completedAt: session.completedAt,
            duration,
            metadata: session.metadata,
        };
    }

    private arrayToObject(arr: any[], keyField: string, valueField: string): Record<string, number> {
        const obj: Record<string, number> = {};
        arr.forEach(item => {
            const key = item[keyField] || 'Unknown';
            obj[key] = parseInt(item[valueField]);
        });
        return obj;
    }
}