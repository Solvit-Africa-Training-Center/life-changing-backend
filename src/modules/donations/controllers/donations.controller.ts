// src/modules/donations/controllers/donations.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { DonationsService } from '../services/donations.service';
import { CreateDonationDto } from '../dto/create-donation.dto';
import { CreateRecurringDonationDto, UpdateRecurringDonationDto, CancelRecurringDonationDto } from '../dto/create-recurring-donation.dto';
import type { PaginationParams } from '../../../shared/interfaces/pagination.interface';
import { DonationStatsDto, RecurringDonationStatsDto } from '../dto/donation-stats.dto';
import { UserType, PaymentStatus, RecurringStatus } from '../../../config/constants';
import { Donor } from '../entities/donor.entity';
import { DonorServiceInterceptor } from 'src/common/interceptors/donor-service.interceptor';
import { CurrentDonor } from 'src/common/decorators/current-donor.decorator';

@ApiTags('donations')
@Controller('donations')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(DonorServiceInterceptor)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) { }

  @Post()
  @Roles(UserType.DONOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Make a donation' })
  @ApiResponse({ status: 201, description: 'Donation processed successfully' })
  async createDonation(
    @CurrentDonor() donor: Donor,
    @Req() req,
    @Body() createDonationDto: CreateDonationDto) {
    const processDonationDto = {
      ...createDonationDto,
      donorId: donor.id,
    };

    // Get metadata from request
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    };

    return this.donationsService.processDonation(processDonationDto, metadata);
  }

  @Post('webhook/confirm')
  @ApiOperation({ summary: 'Webhook to confirm donation payment' })
  async confirmDonationWebhook(@Body() body: any) {
    const { transactionId, paymentDetails } = body;
    return this.donationsService.confirmDonation(transactionId, paymentDetails);
  }

  @Post('recurring')
  @Roles(UserType.DONOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a recurring donation' })
  @ApiResponse({ status: 201, description: 'Recurring donation created' })
  async createRecurringDonation(
    @CurrentDonor() donor: Donor,
    @Body() createRecurringDonationDto: CreateRecurringDonationDto) {
    return this.donationsService.createRecurringDonation(
      donor.id,
      createRecurringDonationDto
    );
  }

  @Get()
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all donations (admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  async getAllDonations(@Query() paginationParams: PaginationParams) {
    return this.donationsService.paginate(paginationParams, {}, ['donor', 'project', 'program']);
  }

  @Get('my-donations')
  @Roles(UserType.DONOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my donations' })
  async getMyDonations(
    @CurrentDonor() donor: Donor,
    @Query() paginationParams: PaginationParams,
  ) {
    return this.donationsService.getDonationsByDonor(
      donor.id,
      paginationParams
    );
  }

  @Get('my-recurring')
  @Roles(UserType.DONOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my recurring donations' })
  async getMyRecurringDonations(
    @CurrentDonor() donor: Donor,
    @Query() paginationParams: PaginationParams,
  ) {
    return this.donationsService.getRecurringDonationsByDonor(
      donor.id,
      paginationParams
    );
  }

  @Get('program/:programId')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get donations by program' })
  async getDonationsByProgram(
    @Param('programId') programId: string,
    @Query() paginationParams: PaginationParams,
  ) {
    return this.donationsService.getDonationsByProgram(programId, paginationParams);
  }

  @Get('project/:projectId')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get donations by project' })
  async getDonationsByProject(
    @Param('projectId') projectId: string,
    @Query() paginationParams: PaginationParams,
  ) {
    return this.donationsService.getDonationsByProject(projectId, paginationParams);
  }

  @Get('status/:status')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get donations by payment status' })
  async getDonationsByStatus(
    @Param('status') status: PaymentStatus,
    @Query() paginationParams: PaginationParams,
  ) {
    const where = { paymentStatus: status };
    return this.donationsService.paginate(paginationParams, where, ['donor', 'project', 'program']);
  }

  @Get('search')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search donations' })
  async searchDonations(
    @Query('q') query: string,
    @Query() paginationParams: PaginationParams,
  ) {
    return this.donationsService.searchDonations(query, paginationParams);
  }

  @Get('stats')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get donation statistics' })
  @ApiResponse({ status: 200, type: DonationStatsDto })
  async getDonationStats(): Promise<DonationStatsDto> {
    return this.donationsService.getDonationStats();
  }

  @Get('recurring-stats')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recurring donation statistics' })
  @ApiResponse({ status: 200, type: RecurringDonationStatsDto })
  async getRecurringDonationStats(): Promise<RecurringDonationStatsDto> {
    return this.donationsService.getRecurringDonationStats();
  }

  @Get(':id')
  @Roles(UserType.DONOR, UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get donation by ID' })
  async getDonation(@Param('id') id: string, @CurrentDonor() donor: Donor, @Req() req) {
    const donation = await this.donationsService.findOne(id, ['donor', 'project', 'program']);

    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    // Check permission
    const isAdmin = req.user.userType === UserType.ADMIN;
    const isOwner = donation.donor?.id === donor.id;

    if (!isAdmin && !isOwner) {
      throw new BadRequestException('Not authorized to view this donation');
    }

    return donation;
  }

  @Put('recurring/:id')
  @Roles(UserType.DONOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update recurring donation' })
  async updateRecurringDonation(
    @Param('id') id: string,
    @Body() updateDto: UpdateRecurringDonationDto,
    @CurrentDonor() donor: Donor,
  ) {
    // await this.checkRecurringDonationOwnership(id, donor.id);
    return this.donationsService.updateRecurringDonation(id, updateDto);
  }

  @Post('recurring/:id/cancel')
  @Roles(UserType.DONOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel recurring donation' })
  async cancelRecurringDonation(
    @Param('id') id: string,
    @Body() cancelDto: CancelRecurringDonationDto,
  ) {
    return this.donationsService.cancelRecurringDonation(id, cancelDto.reason);
  }

  @Post('process-recurring')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process pending recurring charges (admin only)' })
  async processRecurringCharges() {
    await this.donationsService.processRecurringCharges();
    return { message: 'Recurring charges processed successfully' };
  }

  @Delete(':id')
  @Roles(UserType.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete donation (admin only)' })
  async deleteDonation(@Param('id') id: string) {
    await this.donationsService.delete(id);
  }

  // Add this private method to your controller
  // private async checkRecurringDonationOwnership(recurringId: string, donorId: string): Promise<void> {
  //   const recurring = await this.donationsService.findRecurringDonation(recurringId);

  //   if (!recurring) {
  //     throw new NotFoundException('Recurring donation not found');
  //   }

  //   if (recurring.donor.id !== donorId) {
  //     throw new BadRequestException('Not authorized to modify this recurring donation');
  //   }
  // }
}