// src/modules/donations/controllers/donors.controller.ts
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
  NotFoundException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { DonorsService } from '../services/donors.service';
import { CreateDonorDto } from '../dto/create-donor.dto';
import { UpdateDonorDto } from '../dto/update-donor.dto';
import type { PaginationParams } from '../../../shared/interfaces/pagination.interface';
import { UserType } from '../../../config/constants';
import { DonorStatsDto } from '../dto/donor-stats.dto';

@ApiTags('donors')
@Controller('donors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

@Post('profile')
@Roles(UserType.DONOR)
@ApiBearerAuth()
@ApiOperation({ summary: 'Complete donor profile' })
@ApiResponse({ status: 201, description: 'Donor profile completed' })
async createDonorProfile(@Req() req, @Body() createDonorDto: CreateDonorDto) {
  // Check if donor profile was created during registration
  const existingDonor = await this.donorsService.findDonorByUserId(req.user.id);
  
  if (!existingDonor) {
    throw new NotFoundException('No donor profile found. Please register first.');
  }
  // Update with additional details
  return this.donorsService.updateDonor(existingDonor.id, createDonorDto);
}

  @Get('profile')
  @Roles(UserType.DONOR, UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get donor profile' })
  @ApiResponse({ status: 200, description: 'Donor profile returned' })
  async getDonorProfile(@Req() req) {
    return this.donorsService.findDonorByUserId(req.user.id);
  }

  @Put('profile')
  @Roles(UserType.DONOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update donor profile' })
  @ApiResponse({ status: 200, description: 'Donor profile updated' })
  async updateDonorProfile(@Req() req, @Body() updateDonorDto: UpdateDonorDto) {
    const donor = await this.donorsService.findDonorByUserId(req.user.id);
    if (!donor) {
      throw new NotFoundException('Donor profile not found');
    }
    return this.donorsService.updateDonor(donor.id, updateDonorDto);
  }

  @Get()
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all donors (admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  async getAllDonors(@Query() paginationParams: PaginationParams) {
    return this.donorsService.paginate(paginationParams, {}, ['user']);
  }

  @Get('country/:country')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get donors by country' })
  async getDonorsByCountry(
    @Param('country') country: string,
    @Query() paginationParams: PaginationParams,
  ) {
    return this.donorsService.getDonorsByCountry(country, paginationParams);
  }

  @Get('top')
  @ApiOperation({ summary: 'Get top donors (public)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopDonors(@Query('limit') limit?: number) {
    return this.donorsService.getTopDonors(limit);
  }

  @Get('search')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search donors' })
  async searchDonors(
    @Query('q') query: string,
    @Query() paginationParams: PaginationParams,
  ) {
    return this.donorsService.searchDonors(query, paginationParams);
  }

  @Get('stats')
   @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get donor statistics (admin only)' })
    @ApiResponse({ 
    status: 200, 
    description: 'Donor statistics returned',
    type: DonorStatsDto 
    })
    async getDonorStats(): Promise<DonorStatsDto> {
        return this.donorsService.getDonorStats();
    }
  @Delete(':id')
  @Roles(UserType.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete donor (admin only)' })
  async deleteDonor(@Param('id') id: string) {
    await this.donorsService.delete(id);
  }
}