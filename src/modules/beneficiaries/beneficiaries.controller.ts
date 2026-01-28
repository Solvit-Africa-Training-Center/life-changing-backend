import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { BeneficiariesService } from './beneficiaries.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateWeeklyTrackingDto } from './dto/create-weekly-tracking.dto';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

@Controller('beneficiaries')
@UseGuards(JwtAuthGuard)
export class BeneficiariesController {
    constructor(private readonly beneficiariesService: BeneficiariesService) { }

    @Get('my-program')
    async getMyProgram(@Req() req) {
        return this.beneficiariesService.getProgramInfo(req.user.id);
    }

    @Get('profile')
    async getProfile(@Req() req) {
        return this.beneficiariesService.getProfile(req.user.id);
    }

    @Get('my-updates')
    async getMyUpdates(@Req() req) {
        return this.beneficiariesService.getUpdates(req.user.id);
    }

    @Post('tracking')
    async submitTracking(@Req() req, @Body() createTrackingDto: CreateWeeklyTrackingDto) {
        return this.beneficiariesService.submitWeeklyTracking(req.user.id, createTrackingDto);
    }

    @Post('goals')
    async createGoal(@Req() req, @Body() createGoalDto: CreateGoalDto) {
        return this.beneficiariesService.createGoal(req.user.id, createGoalDto);
    }

    @Patch('goals/:id')
    async updateGoal(
        @Req() req,
        @Param('id') id: string,
        @Body() updateGoalDto: UpdateGoalDto
    ) {
        return this.beneficiariesService.updateGoal(req.user.id, id, updateGoalDto);
    }

    @Post('support')
    async requestSupport(@Req() req, @Body('description') description: string) {
        return this.beneficiariesService.requestSupport(req.user.id, description);
    }

    @Get('ussd-summary')
    async getUSSDSummary(@Req() req, @Query('lang') lang: 'en' | 'rw' = 'en') {
        return this.beneficiariesService.getUSSDSummary(req.user.id, lang);
    }
}
