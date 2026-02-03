// src/modules/beneficiaries/controllers/ussd.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WeeklyTrackingService } from '../beneficiaries/services/weekly-tracking.service';
import { BeneficiariesService } from '../beneficiaries/services/beneficiaries.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserType } from 'src/config/constants';

@ApiTags('beneficiaries')
@Controller('ussd/beneficiaries')
export class UssdController {
  constructor(
    private readonly trackingService: WeeklyTrackingService,
    private readonly beneficiariesService: BeneficiariesService,
  ) {}

  @Post('tracking/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.BENEFICIARY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync offline tracking data via USSD' })
  @ApiResponse({
    status: 200,
    description: 'Tracking data synced successfully',
  })
  async syncTrackingData(
    @Body() body: {
      beneficiaryId: string;
      trackings: any[]; // Array of CreateTrackingDto
      sessionId: string;
    }
  ) {
    const results = [];
    
    for (const trackingData of body.trackings) {
      try {
        const tracking = await this.trackingService.createTracking(
          body.beneficiaryId,
          trackingData,
          body.beneficiaryId, // Submitted by beneficiary
          UserType.BENEFICIARY
        );
        results.push({ success: true, trackingId: tracking.id });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    return {
      sessionId: body.sessionId,
      syncedAt: new Date().toISOString(),
      results,
      total: body.trackings.length,
      successful: results.filter(r => r.success).length,
    };
  }

  @Post('profile/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.BENEFICIARY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update profile via USSD' })
  async updateProfileViaUssd(
    @Body() body: {
      beneficiaryId: string;
      updates: {
        businessType?: string;
        phone?: string;
        location?: any;
      };
    }
  ) {
    const beneficiary = await this.beneficiariesService.findBeneficiaryByUserId(body.beneficiaryId);
    
    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    await this.beneficiariesService.updateBeneficiary(beneficiary.id, body.updates);

    return {
      success: true,
      message: 'Profile updated successfully',
      updatedAt: new Date().toISOString(),
    };
  }
}