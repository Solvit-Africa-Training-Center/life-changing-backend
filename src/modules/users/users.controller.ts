import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  Body,
  Query,
  UseGuards,
  Inject,
  forwardRef,
  NotFoundException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserType } from '../../config/constants';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './services/users.service';
import { DonorsService } from '../donations/services/donors.service';
import { BeneficiariesService } from '../beneficiaries/services/beneficiaries.service';
import { StaffService } from '../admin/services/staff.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { ActivateUserDto } from './dto/activate-user.dto';
import type { PaginationParams } from 'src/shared/interfaces/pagination.interface';
import { ReactivateUserDto } from './dto/reactivate-user.dto';
import { DeactivateUserDto } from './dto/deactivate-user.dto';

// Define interfaces for profile status
interface ProfileStatus {
  hasProfile: boolean;
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  profileDetails: any | null;
}

interface IncompleteProfileUser {
  userId: string;
  fullName: string;
  email: string | null;
  phone: string;
  userType: UserType;
  profileType: string;
  registeredAt: Date;
  missingFields: string[];
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => DonorsService))
    private readonly donorsService: DonorsService,
    @Inject(forwardRef(() => BeneficiariesService))
    private readonly beneficiariesService: BeneficiariesService,
    @Inject(forwardRef(() => StaffService))
    private readonly staffService: StaffService,
  ) { }


  // Optional: Add endpoint to get all users with incomplete profiles
 @Get('incomplete-profiles')
@Roles(UserType.ADMIN)
@ApiOperation({ summary: 'Get all users with incomplete profiles (Admin only)' })
@ApiQuery({ name: 'userType', required: false, enum: UserType })
async getIncompleteProfiles(@Query('userType') userType?: UserType) {
  const users = await this.usersService.findAll(
    userType ? { userType } : undefined
  );

  const results: IncompleteProfileUser[] = [];

  for (const user of users) {
    let isComplete = false;
    let profileType = '';
    let missingFields: string[] = [];

    switch (user.userType) {
      case UserType.DONOR:
        const donor = await this.donorsService.findDonorByUserId(user.id);
        profileType = 'donor';
        if (donor) {
          missingFields = this.getMissingDonorFields(donor);
          isComplete = missingFields.length === 0;
        } else {
          missingFields = ['profile_not_created'];
        }
        break;
      case UserType.BENEFICIARY:
        const beneficiary = await this.beneficiariesService.findBeneficiaryByUserId(user.id);
        profileType = 'beneficiary';
        if (beneficiary) {
          missingFields = this.getMissingBeneficiaryFields(beneficiary);
          isComplete = missingFields.length === 0;
        } else {
          missingFields = ['profile_not_created'];
        }
        break;
      case UserType.ADMIN:
        const staff = await this.staffService.findStaffByUserId(user.id);
        profileType = 'staff';
        if (staff) {
          missingFields = this.getMissingStaffFields(staff);
          isComplete = missingFields.length === 0;
        } else {
          missingFields = ['profile_not_created'];
        }
        break;
    }

    if (!isComplete) {
      results.push({
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        profileType,
        registeredAt: user.createdAt,
        missingFields: missingFields // Add this to see what's missing
      });
    }
  }
  return {
    totalIncomplete: results.length,
    users: results
  };
}
  // LIST PENDING ACTIVATION USERS (Admin only)
  @Get('pending-activation')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get users pending activation (Admin only)' })
  async getPendingActivationUsers(@Query() paginationParams: PaginationParams) {
    return this.usersService.getPendingActivationUsers(paginationParams);
  }

  @Get('stats/count')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  async getUserStats(@Query('userType') userType?: UserType) {
    const total = await this.usersService.countUsersByType();
    const byType = userType
      ? { [userType]: await this.usersService.countUsersByType(userType) }
      : null;

    return {
      total,
      byType,
    };
  }

  @Get()
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'userType', required: false, enum: UserType })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
    @Query('userType') userType?: UserType,
  ) {
    const paginationParams = { page, limit };

    if (search) {
      return this.usersService.searchUsers(search, paginationParams);
    }

    if (userType) {
      return this.usersService.getUsersByType(userType, paginationParams);
    }

    return this.usersService.paginate(paginationParams);
  }

  @Get(':id')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Get(':id/profile-status')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Get user profile completion status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Profile status returned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfileStatus(@Param('id') id: string) {
    // Check if user exists
    const user = await this.usersService.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let profileStatus: ProfileStatus = {
      hasProfile: false,
      isComplete: false,
      completionPercentage: 0,
      missingFields: ['profile_not_created'],
      profileDetails: null
    };

    // Check profile based on user type
    switch (user.userType) {
      case UserType.DONOR:
        const donor = await this.donorsService.findDonorByUserId(id);
        if (donor) {
          const missingFields = this.getMissingDonorFields(donor);
          // Donor has 4 required fields: country, preferredCurrency, communicationPreferences, receiptPreference
          profileStatus = {
            hasProfile: true,
            isComplete: missingFields.length === 0,
            completionPercentage: this.calculateCompletionPercentage(4, missingFields.length),
            missingFields,
            profileDetails: {
              country: donor.country,
              preferredCurrency: donor.preferredCurrency,
              totalDonated: donor.totalDonated,
              isRecurringDonor: donor.isRecurringDonor,
              lastDonationDate: donor.lastDonationDate,
            }
          };
        }
        break;

      case UserType.BENEFICIARY:
        const beneficiary = await this.beneficiariesService.findBeneficiaryByUserId(id);
        if (beneficiary) {
          const missingFields = this.getMissingBeneficiaryFields(beneficiary);
          // Beneficiary has 7 required fields: dateOfBirth, location, program, enrollmentDate, startCapital, businessType, trackingFrequency
          profileStatus = {
            hasProfile: true,
            isComplete: missingFields.length === 0,
            completionPercentage: this.calculateCompletionPercentage(7, missingFields.length),
            missingFields,
            profileDetails: {
              program: beneficiary.program?.name || 'No program assigned',
              status: beneficiary.status,
              currentCapital: beneficiary.currentCapital,
              businessType: beneficiary.businessType,
              enrollmentDate: beneficiary.enrollmentDate,
              requiresSpecialAttention: beneficiary.requiresSpecialAttention,
            }
          };
        }
        break;

      case UserType.ADMIN:
        const staff = await this.staffService.findStaffByUserId(id);
        if (staff) {
          const missingFields = this.getMissingStaffFields(staff);
          // Staff has 3 required fields: position, department, contactInfo
          profileStatus = {
            hasProfile: true,
            isComplete: missingFields.length === 0,
            completionPercentage: this.calculateCompletionPercentage(3, missingFields.length),
            missingFields,
            profileDetails: {
              position: staff.position,
              department: staff.department,
              contactInfo: staff.contactInfo,
            }
          };
        }
        break;
    }

    return {
      userId: user.id,
      userType: user.userType,
      userEmail: user.email,
      userPhone: user.phone,
      isVerified: user.isVerified,
      isActive: user.isActive,
      ...profileStatus
    };
  }

  private getMissingDonorFields(donor: any): string[] {
    const missing: string[] = [];
    const requiredFields = ['country', 'preferredCurrency', 'communicationPreferences', 'receiptPreference'];

    requiredFields.forEach(field => {
      if (!donor[field]) {
        missing.push(field);
      }
    });

    // Special check for communicationPreferences object
    if (donor.communicationPreferences && (
      typeof donor.communicationPreferences.email !== 'boolean' ||
      typeof donor.communicationPreferences.sms !== 'boolean'
    )) {
      if (!missing.includes('communicationPreferences')) {
        missing.push('communicationPreferences');
      }
    }

    return missing;
  }

  private getMissingBeneficiaryFields(beneficiary: any): string[] {
    const missing: string[] = [];
    const requiredFields = ['dateOfBirth', 'location', 'program', 'enrollmentDate', 'startCapital', 'businessType', 'trackingFrequency'];

    requiredFields.forEach(field => {
      if (!beneficiary[field]) {
        missing.push(field);
      }
    });

    // Special check for location object
    if (beneficiary.location && (
      !beneficiary.location.district ||
      !beneficiary.location.sector ||
      !beneficiary.location.cell ||
      !beneficiary.location.village
    )) {
      if (!missing.includes('location')) {
        missing.push('location_details');
      }
    }

    // Check if program exists (not just the relation, but if it has data)
    if (beneficiary.program && !beneficiary.program.id) {
      if (!missing.includes('program')) {
        missing.push('program');
      }
    }

    return missing;
  }

  private getMissingStaffFields(staff: any): string[] {
    const missing: string[] = [];
    const requiredFields = ['position', 'department', 'contactInfo'];

    requiredFields.forEach(field => {
      if (!staff[field]) {
        missing.push(field);
      }
    });

    // Special check for contactInfo object
    if (staff.contactInfo && (
      !staff.contactInfo.emergencyContact ||
      !staff.contactInfo.emergencyPhone ||
      !staff.contactInfo.address
    )) {
      if (!missing.includes('contactInfo')) {
        missing.push('contactInfo_details');
      }
    }

    return missing;
  }

  private calculateCompletionPercentage(totalFields: number, missingCount: number): number {
    const completedFields = totalFields - missingCount;
  const percentage = Math.round((completedFields / totalFields) * 100);
  return Math.max(0, Math.min(100, percentage));
  }

  //USER ACTIVATION ENDPOINT (Admin only)
  @Patch(':id/activate')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate/deactivate user account (Admin only)' })
  async activateUser(
    @Param('id') id: string,
    @Body() activateDto: ActivateUserDto,
    @CurrentUser() adminUser: AuthUser, // Use CurrentUser decorator
  ) {
    // Pass admin ID from current user
    return this.usersService.activateUser(id, activateDto, adminUser.id);
  }

  //USER DESACTIVATION ENDPOINT (Admin only)
  @Patch(':id/deactivate')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate user account (Admin only)' })
  async deactivateUser(
    @Param('id') id: string,
    @Body() deactivateDto: DeactivateUserDto,
    @CurrentUser() adminUser: AuthUser,
  ) {
    // Create activateDto with isActive: false
    const activateDto: ActivateUserDto = {
      isActive: false,
      reason: deactivateDto.reason,
    };

    return this.usersService.activateUser(id, activateDto, adminUser.id);
  }

  @Patch(':id/reactivate')
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reactivate user account (Admin only)' })
  async reactivateUser(
    @Param('id') id: string,
    @Body() reactivateDto: ReactivateUserDto,
    @CurrentUser() adminUser: AuthUser,
  ) {
    // Create activateDto with isActive: true
    const activateDto: ActivateUserDto = {
      isActive: true,
      reason: reactivateDto.reason,
    };

    return this.usersService.activateUser(id, activateDto, adminUser.id);
  }
  // GET USER STATUS ENDPOINT
  @Get(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user account status' })
  async getUserStatus(@Param('id') id: string) {
    return this.usersService.getUserStatus(id);
  }

}
