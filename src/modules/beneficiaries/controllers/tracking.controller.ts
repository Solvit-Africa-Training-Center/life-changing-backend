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
  HttpStatus,
  Delete,
  ForbiddenException,
  NotFoundException,
  HttpCode,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentBeneficiary } from '../../../common/decorators/current-beneficiary.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { WeeklyTrackingService } from '../services/weekly-tracking.service';
import { CreateTrackingDto } from '../dto/create-tracking.dto';
import { UserType } from '../../../config/constants';
import type { PaginationParams } from '../../../shared/interfaces/pagination.interface';
import { Beneficiary } from '../entities/beneficiary.entity';
import type { AuthUser } from 'src/modules/auth/interfaces/auth-user.interface';
import { BeneficiaryServiceInterceptor } from 'src/common/interceptors/beneficiary-service.interceptor';

@ApiTags('beneficiaries')
@Controller('beneficiaries/tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UseInterceptors(BeneficiaryServiceInterceptor)
export class TrackingController {
  constructor(private readonly trackingService: WeeklyTrackingService) {}

  @Post()
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Submit weekly tracking' })
  @ApiResponse({ status: 201, description: 'Tracking submitted successfully' })
  async submitTracking(
    @CurrentBeneficiary() beneficiary: Beneficiary,
    @CurrentUser() user: AuthUser,
    @Body() createTrackingDto: CreateTrackingDto,
    @Query('beneficiaryId') beneficiaryId?: string
  ) {
    // Determine which beneficiary to use
    const targetBeneficiaryId = this.getTargetBeneficiaryId(beneficiary, beneficiaryId, user.userType);
    
    return this.trackingService.createTracking(
      targetBeneficiaryId,
      createTrackingDto,
      user.id,
      user.userType
    );
  }

  @Get()
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get tracking history' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'beneficiaryId', required: false, description: 'Required for admin users accessing other beneficiaries' })
  @ApiResponse({ status: 200, description: 'Tracking history retrieved' })
  async getTrackingHistory(
    @CurrentBeneficiary() beneficiary: Beneficiary,
    @CurrentUser() user: AuthUser,
    @Query() paginationParams: PaginationParams,
    @Query('beneficiaryId') beneficiaryId?: string
  ) {
    const targetBeneficiaryId = this.getTargetBeneficiaryId(beneficiary, beneficiaryId, user.userType);
    return this.trackingService.getBeneficiaryTrackings(targetBeneficiaryId, paginationParams);
  }

  @Get('recent')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get recent trackings' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of recent trackings (default: 5)' })
  @ApiQuery({ name: 'beneficiaryId', required: false, description: 'Required for admin users accessing other beneficiaries' })
  @ApiResponse({ status: 200, description: 'Recent trackings retrieved' })
  async getRecentTrackings(
    @CurrentBeneficiary() beneficiary: Beneficiary,
    @CurrentUser() user: AuthUser,
    @Query('limit') limit: number = 5,
    @Query('beneficiaryId') beneficiaryId?: string
  ) {
    const targetBeneficiaryId = this.getTargetBeneficiaryId(beneficiary, beneficiaryId, user.userType);
    return this.trackingService.getRecentTrackings(targetBeneficiaryId, limit);
  }

  @Get('attendance-stats')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get attendance statistics' })
  @ApiQuery({ name: 'beneficiaryId', required: false, description: 'Required for admin users accessing other beneficiaries' })
  @ApiResponse({ status: 200, description: 'Attendance statistics retrieved' })
  async getAttendanceStats(
    @CurrentBeneficiary() beneficiary: Beneficiary,
    @CurrentUser() user: AuthUser,
    @Query('beneficiaryId') beneficiaryId?: string
  ) {
    const targetBeneficiaryId = this.getTargetBeneficiaryId(beneficiary, beneficiaryId, user.userType);
    return this.trackingService.getAttendanceStats(targetBeneficiaryId);
  }

  @Get('date-range')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Get trackings by date range (admin only)' })
  @ApiQuery({ name: 'startDate', required: true, description: 'YYYY-MM-DD format' })
  @ApiQuery({ name: 'endDate', required: true, description: 'YYYY-MM-DD format' })
  @ApiQuery({ name: 'beneficiaryId', required: false, description: 'Filter by specific beneficiary' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Trackings by date range retrieved' })
  async getTrackingsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('beneficiaryId') beneficiaryId?: string,
    @Query() paginationParams?: PaginationParams
  ) {
    if (beneficiaryId) {
      // If beneficiaryId is provided, get trackings for that specific beneficiary
      return this.trackingService.getBeneficiaryTrackings(
        beneficiaryId,
        paginationParams || { page: 1, limit: 20 }
      );
    }
    
    // Otherwise, get all trackings within the date range
    return this.trackingService.getTrackingsByDateRange(
      new Date(startDate),
      new Date(endDate),
      paginationParams || { page: 1, limit: 20 }
    );
  }

  @Get(':id')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get tracking by ID' })
  @ApiResponse({ status: 200, description: 'Tracking retrieved' })
  @ApiResponse({ status: 404, description: 'Tracking not found' })
  @ApiResponse({ status: 403, description: 'Forbidden access' })
  async getTrackingById(
    @Param('id') id: string,
    @CurrentBeneficiary() beneficiary: Beneficiary,
    @CurrentUser() user: AuthUser
  ) {
    const tracking = await this.trackingService.findOne(id, ['beneficiary', 'submittedBy', 'verifiedBy']);
    
    if (!tracking) {
      throw new NotFoundException('Tracking not found');
    }
    
    // Check ownership - admin can access any, beneficiary only their own
    if (tracking.beneficiary.id !== beneficiary.id && user.userType !== UserType.ADMIN) {
      throw new ForbiddenException('You do not have permission to access this tracking');
    }
    
    return tracking;
  }

  @Put(':id/verify')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Verify tracking (admin only)' })
  @ApiResponse({ status: 200, description: 'Tracking verified' })
  @ApiResponse({ status: 404, description: 'Tracking not found' })
  async verifyTracking(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @CurrentUser() user: AuthUser
  ) {
    return this.trackingService.verifyTracking(id, user.id, body.notes);
  }

  @Delete(':id')
  @Roles(UserType.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tracking (admin only)' })
  @ApiResponse({ status: 204, description: 'Tracking deleted' })
  @ApiResponse({ status: 404, description: 'Tracking not found' })
  async deleteTracking(@Param('id') id: string) {
    await this.trackingService.delete(id);
  }

  /**
   * Helper method to determine target beneficiary ID
   * - For beneficiaries: always use their own ID
   * - For admins: use provided beneficiaryId or their own if not provided
   */
  private getTargetBeneficiaryId(
    currentBeneficiary: Beneficiary, 
    requestedBeneficiaryId?: string,
    userType?: UserType
  ): string {
    // For beneficiary users, they can only access their own data
    if (userType === UserType.BENEFICIARY) {
      return currentBeneficiary.id;
    }
    
    // For admin users
    if (userType === UserType.ADMIN) {
      // If admin provides a beneficiaryId, use it
      if (requestedBeneficiaryId) {
        return requestedBeneficiaryId;
      }
      // Otherwise, admin might be accessing their own beneficiary profile (if they have one)
      return currentBeneficiary.id;
    }
    
    // Fallback - should not reach here due to role guards
    return currentBeneficiary.id;
  }
}