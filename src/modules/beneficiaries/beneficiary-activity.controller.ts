import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BeneficiaryActivityService } from './services/beneficiary-activity.service';
import { BeneficiaryUssdService } from './services/beneficiary-ussd.service';
import { CreateWeeklyTrackingDto } from './dto/create-weekly-tracking.dto';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

@ApiTags('beneficiaries')
@ApiBearerAuth()
@Controller('beneficiaries')
@UseGuards(JwtAuthGuard)
export class BeneficiaryActivityController {
    constructor(
        private readonly activityService: BeneficiaryActivityService,
        private readonly ussdService: BeneficiaryUssdService
    ) { }

    @Get('my-updates')
    @ApiOperation({ summary: 'Get my updates' })
    async getMyUpdates(@Req() req) {
        return this.activityService.getUpdates(req.user.id);
    }

    @Post('tracking')
    @ApiOperation({ summary: 'Submit weekly tracking' })
    async submitTracking(@Req() req, @Body() dto: CreateWeeklyTrackingDto) {
        return this.activityService.submitTracking(req.user.id, dto);
    }

    @Post('goals')
    @ApiOperation({ summary: 'Create a new goal' })
    async createGoal(@Req() req, @Body() dto: CreateGoalDto) {
        return this.activityService.createGoal(req.user.id, dto);
    }

    @Patch('goals/:id')
    @ApiOperation({ summary: 'Update a goal' })
    @ApiParam({ name: 'id', description: 'Goal ID' })
    async updateGoal(@Req() req, @Param('id') id: string, @Body() dto: UpdateGoalDto) {
        return this.activityService.updateGoal(req.user.id, id, dto);
    }

    @Post('support')
    @ApiOperation({ summary: 'Request support' })
    @ApiBody({ schema: { type: 'object', properties: { description: { type: 'string' } } } })
    async requestSupport(@Req() req, @Body('description') desc: string) {
        return this.activityService.requestSupport(req.user.id, desc);
    }

    @Get('ussd-summary')
    @ApiOperation({ summary: 'Get USSD summary' })
    @ApiQuery({ name: 'lang', enum: ['en', 'rw'], required: false })
    async getUSSDSummary(@Req() req, @Query('lang') lang: 'en' | 'rw' = 'en') {
        return this.ussdService.getSummary(req.user.id, lang);
    }
}
