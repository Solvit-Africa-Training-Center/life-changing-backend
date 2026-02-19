// src/modules/ussd/ussd-stats.controller.ts
import { 
    Controller, 
    Get, 
    Param, 
    Query, 
    UseGuards,
    HttpStatus,
    ParseUUIDPipe,
    Logger,
    Res
} from '@nestjs/common';
import type { Response } from 'express'; 
import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiBearerAuth,
    ApiQuery 
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

import { Language, UserType } from 'src/config/constants';
import { UssdStatsService } from '../services/ussd-stats.service';
import { UssdSessionDetailsDto, UssdStatsDto, UssdStatsQueryDto } from '../dto/ussd-stats.dto';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('ussd-stats')
@Controller('ussd/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UssdStatsController {
    private readonly logger = new Logger(UssdStatsController.name);

    constructor(private readonly ussdStatsService: UssdStatsService) {}

    @Get()
    @Roles(UserType.ADMIN, UserType.ADMIN)
    @ApiOperation({ summary: 'Get USSD session statistics' })
    @ApiResponse({ 
        status: HttpStatus.OK,  
        description: 'Statistics retrieved successfully',
        type: UssdStatsDto 
    })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    @ApiQuery({ name: 'userType', required: false, enum: UserType })
    @ApiQuery({ name: 'language', required: false, enum: Language })
    @ApiQuery({ name: 'network', required: false })
    async getStats(@Query() query: UssdStatsQueryDto): Promise<UssdStatsDto> {
        this.logger.log(`Fetching USSD stats with filters: ${JSON.stringify(query)}`);
        return this.ussdStatsService.getStatistics(query);
    }

    @Get('sessions')
    @Roles(UserType.ADMIN, UserType.ADMIN)
    @ApiOperation({ summary: 'Get all USSD sessions with details' })
    @ApiResponse({ 
        status: HttpStatus.OK, 
        description: 'Sessions retrieved successfully',
        type: [UssdSessionDetailsDto] 
    })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean })
    @ApiQuery({ name: 'userType', required: false, enum: UserType })
    async getSessions(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('isActive') isActive?: boolean,
        @Query('userType') userType?: UserType
    ) {
        return this.ussdStatsService.getSessions({
            page,
            limit,
            isActive,
            userType
        });
    }

    @Get('sessions/:id')
    @Roles(UserType.ADMIN, UserType.ADMIN)
    @ApiOperation({ summary: 'Get session details by ID' })
    @ApiResponse({ 
        status: HttpStatus.OK, 
        description: 'Session details retrieved successfully',
        type: UssdSessionDetailsDto 
    })
    async getSessionById(
        @Param('id', ParseUUIDPipe) id: string
    ): Promise<UssdSessionDetailsDto> {
        return this.ussdStatsService.getSessionDetails(id);
    }

    @Get('sessions/phone/:phoneNumber')
    @Roles(UserType.ADMIN, UserType.ADMIN)
    @ApiOperation({ summary: 'Get sessions by phone number' })
    @ApiResponse({ 
        status: HttpStatus.OK, 
        description: 'Sessions retrieved successfully',
        type: [UssdSessionDetailsDto] 
    })
    async getSessionsByPhone(
        @Param('phoneNumber') phoneNumber: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20
    ) {
        return this.ussdStatsService.getSessionsByPhone(phoneNumber, { page, limit });
    }

    @Get('summary/daily')
    @Roles(UserType.ADMIN, UserType.ADMIN)
    @ApiOperation({ summary: 'Get daily session summary' })
    @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze' })
    async getDailySummary(@Query('days') days: number = 30) {
        return this.ussdStatsService.getDailySummary(days);
    }

    @Get('summary/menus')
    @Roles(UserType.ADMIN, UserType.ADMIN)
    @ApiOperation({ summary: 'Get menu usage statistics' })
    async getMenuStats() {
        return this.ussdStatsService.getMenuStatistics();
    }

    @Get('export')
    @Roles(UserType.ADMIN, UserType.ADMIN)
    @ApiOperation({ summary: 'Export session data as CSV' })
    @ApiQuery({ name: 'startDate', required: false })
    @ApiQuery({ name: 'endDate', required: false })
    async exportSessions(
        @Query() query: UssdStatsQueryDto,
        @Res() res: Response
    ) {
        const csvData = await this.ussdStatsService.exportSessionsToCsv(query);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=ussd-sessions.csv');
        res.send(csvData);
    }
}