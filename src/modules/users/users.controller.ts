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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { DonorsService } from '../donations/services/donors.service';
import { BeneficiariesService } from '../beneficiaries/services/beneficiaries.service';
import { StaffService } from '../admin/services/staff.service';

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
  ) {}

  @Post()
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
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

  @Delete(':id')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }

  @Patch(':id/activate')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Activate user account (Admin only)' })
  async activate(@Param('id') id: string) {
    return this.usersService.activateUser(id);
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

  @Get(':id/profile-status')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Get user profile completion status (Admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile status returned',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: 'uuid' },
        userType: { type: 'string', example: 'donor' },
        hasProfile: { type: 'boolean', example: true },
        isComplete: { type: 'boolean', example: false },
        completionPercentage: { type: 'number', example: 75 },
        missingFields: { type: 'array', items: { type: 'string' } },
        profileDetails: { 
          type: 'object',
          properties: {
            fullName: { type: 'string' },
            // Add other profile fields as needed
          }
        }
      }
    }
  })
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
          profileStatus = {
            hasProfile: true,
            isComplete: missingFields.length === 0,
            completionPercentage: this.calculateCompletionPercentage(5, missingFields.length), // 5 required fields
            missingFields,
            profileDetails: {
              fullName: donor.fullName,
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
          profileStatus = {
            hasProfile: true,
            isComplete: missingFields.length === 0,
            completionPercentage: this.calculateCompletionPercentage(8, missingFields.length), // 8 required fields
            missingFields,
            profileDetails: {
              fullName: beneficiary.fullName,
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
          profileStatus = {
            hasProfile: true,
            isComplete: missingFields.length === 0,
            completionPercentage: this.calculateCompletionPercentage(4, missingFields.length), // 4 required fields
            missingFields,
            profileDetails: {
              fullName: staff.fullName,
              role: staff.role,
              department: staff.department,
              employeeId: staff.employeeId,
              isActive: staff.isActive,
              hireDate: staff.hireDate,
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

    return missing;
  }

  private getMissingBeneficiaryFields(beneficiary: any): string[] {
    const missing: string[] = [];
    const requiredFields = ['dateOfBirth', 'location', 'program', 'startCapital', 'businessType', 'trackingFrequency'];
    
    requiredFields.forEach(field => {
      if (!beneficiary[field]) {
        missing.push(field);
      }
    });

    // Check location details
    if (beneficiary.location && (
      !beneficiary.location.district ||
      !beneficiary.location.sector ||
      !beneficiary.location.cell ||
      !beneficiary.location.village
    )) {
      missing.push('location_details');
    }

    return missing;
  }

  private getMissingStaffFields(staff: any): string[] {
    const missing: string[] = [];
    const requiredFields = ['department', 'permissions', 'employeeId'];
    
    requiredFields.forEach(field => {
      if (!staff[field] || (Array.isArray(staff[field]) && staff[field].length === 0)) {
        missing.push(field);
      }
    });

    return missing;
  }

  private calculateCompletionPercentage(totalFields: number, missingCount: number): number {
    const completedFields = totalFields - missingCount;
    return Math.round((completedFields / totalFields) * 100);
  }

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

      switch (user.userType) {
        case UserType.DONOR:
          const donor = await this.donorsService.findDonorByUserId(user.id);
          profileType = 'donor';
          isComplete = donor ? this.getMissingDonorFields(donor).length === 0 : false;
          break;
        case UserType.BENEFICIARY:
          const beneficiary = await this.beneficiariesService.findBeneficiaryByUserId(user.id);
          profileType = 'beneficiary';
          isComplete = beneficiary ? this.getMissingBeneficiaryFields(beneficiary).length === 0 : false;
          break;
        case UserType.ADMIN:
          const staff = await this.staffService.findStaffByUserId(user.id);
          profileType = 'staff';
          isComplete = staff ? this.getMissingStaffFields(staff).length === 0 : false;
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
        });
      }
    }

    return {
      totalIncomplete: results.length,
      users: results
    };
  }
}
