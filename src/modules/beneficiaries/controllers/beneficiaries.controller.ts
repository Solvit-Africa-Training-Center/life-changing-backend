// src/modules/beneficiaries/controllers/beneficiaries.controller.ts
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
import { BeneficiariesService } from '../services/beneficiaries.service';
import { CreateBeneficiaryDto } from '../dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from '../dto/update-beneficiary.dto';
import type { PaginationParams } from '../../../shared/interfaces/pagination.interface';
import { BeneficiaryStatus, UserType } from '../../../config/constants';
import { BeneficiaryStatsDto } from '../dto/beneficiary-stats.dto';

@ApiTags('beneficiaries')
@Controller('beneficiaries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BeneficiariesController {
  constructor(private readonly beneficiariesService: BeneficiariesService) {}

  @Post('profile')
@Roles(UserType.BENEFICIARY)
@ApiBearerAuth()
@ApiOperation({ summary: 'Complete beneficiary profile' })
@ApiResponse({ status: 201, description: 'Beneficiary profile completed' })
async createBeneficiaryProfile(@Req() req, @Body() createBeneficiaryDto: CreateBeneficiaryDto) {
  // Check if beneficiary profile was created during registration
  const existingBeneficiary = await this.beneficiariesService.findBeneficiaryByUserId(req.user.id);
  
  if (!existingBeneficiary) {
    throw new NotFoundException('No beneficiary profile found. Please register first.');
  }
  // Update with additional details
  return this.beneficiariesService.updateBeneficiary(existingBeneficiary.id, createBeneficiaryDto);
}

  @Get('profile')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get beneficiary profile' })
  @ApiResponse({ status: 200, description: 'Beneficiary profile returned' })
  async getBeneficiaryProfile(@Req() req) {
    return this.beneficiariesService.findBeneficiaryByUserId(req.user.id);
  }

  @Put('profile')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update beneficiary profile' })
  @ApiResponse({ status: 200, description: 'Beneficiary profile updated' })
  async updateBeneficiaryProfile(@Req() req, @Body() updateBeneficiaryDto: UpdateBeneficiaryDto) {
    const beneficiary = await this.beneficiariesService.findBeneficiaryByUserId(req.user.id);
    if (!beneficiary) {
      throw new NotFoundException('Beneficiary profile not found');
    }
    return this.beneficiariesService.updateBeneficiary(beneficiary.id, updateBeneficiaryDto);
  }

  @Get()
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all beneficiaries (admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  async getAllBeneficiaries(@Query() paginationParams: PaginationParams) {
    return this.beneficiariesService.paginate(paginationParams, {}, ['user', 'program']);
  }

  @Get('program/:programId')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get beneficiaries by program' })
  async getBeneficiariesByProgram(
    @Param('programId') programId: string,
    @Query() paginationParams: PaginationParams,
  ) {
    return this.beneficiariesService.getBeneficiariesByProgram(programId, paginationParams);
  }

  @Get('status/:status')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get beneficiaries by status' })
  async getBeneficiariesByStatus(
    @Param('status') status: BeneficiaryStatus,
    @Query() paginationParams: PaginationParams,
  ) {
    return this.beneficiariesService.getBeneficiariesByStatus(status, paginationParams);
  }

  @Get('attention-required')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get beneficiaries requiring special attention' })
  async getBeneficiariesRequiringAttention(@Query() paginationParams: PaginationParams) {
    return this.beneficiariesService.getBeneficiariesRequiringAttention(paginationParams);
  }

  @Put(':id/graduate')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Graduate beneficiary (admin only)' })
  async graduateBeneficiary(@Param('id') id: string) {
    return this.beneficiariesService.graduateBeneficiary(id);
  }

  @Get('search')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search beneficiaries' })
  async searchBeneficiaries(
    @Query('q') query: string,
    @Query() paginationParams: PaginationParams,
  ) {
    return this.beneficiariesService.searchBeneficiaries(query, paginationParams);
  }

  @Get('stats')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get beneficiary statistics (admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Beneficiary statistics returned',
    type: BeneficiaryStatsDto 
    })
  async getBeneficiaryStats():Promise<BeneficiaryStatsDto>{
    return this.beneficiariesService.getBeneficiaryStats();
  }

  @Delete(':id')
  @Roles(UserType.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete beneficiary (admin only)' })
  async deleteBeneficiary(@Param('id') id: string) {
    await this.beneficiariesService.delete(id);
  }
}
