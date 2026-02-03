// src/modules/beneficiaries/controllers/tracking.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { WeeklyTrackingService } from '../services/weekly-tracking.service';
import { CreateTrackingDto, UpdateTrackingDto } from '../dto/create-tracking.dto';
import { UserType } from '../../../config/constants';
import type { PaginationParams } from '../../../shared/interfaces/pagination.interface';

@ApiTags('beneficiaries')
@Controller('beneficiaries/tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TrackingController {
  constructor(private readonly trackingService: WeeklyTrackingService) {}

  @Post()
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Submit weekly tracking' })
  async submitTracking(@Req() req, @Body() createTrackingDto: CreateTrackingDto) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    
    return this.trackingService.createTracking(
      beneficiary.id,
      createTrackingDto,
      req.user.id,
      req.user.userType as UserType
    );
  }

  @Get()
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get tracking history' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getTrackingHistory(
    @Req() req,
    @Query() paginationParams: PaginationParams
  ) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.trackingService.getBeneficiaryTrackings(beneficiary.id, paginationParams);
  }

  @Get('recent')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get recent trackings' })
  async getRecentTrackings(@Req() req, @Query('limit') limit: number = 5) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.trackingService.getRecentTrackings(beneficiary.id, limit);
  }

  @Get('attendance-stats')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get attendance statistics' })
  async getAttendanceStats(@Req() req) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.trackingService.getAttendanceStats(beneficiary.id);
  }

  @Put(':id/verify')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Verify tracking (admin only)' })
  async verifyTracking(
    @Param('id') id: string,
    @Req() req,
    @Body() body: { notes?: string }
  ) {
    return this.trackingService.verifyTracking(id, req.user.id, body.notes);
  }

  private async getBeneficiaryFromRequest(req: any) {
    // Implementation similar to DocumentsController
    // Get beneficiary based on user type
  }
}