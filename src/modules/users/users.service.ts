import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository , In} from 'typeorm';
import { User } from './entities/user.entity';
import { BaseService } from '../../shared/services/base.service';
import { PaginatedResponse, PaginationParams } from '../../shared/interfaces/pagination.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserType } from '../../config/constants';
import { ActivateUserDto } from './dto/activate-user.dto';
import { Donor } from '../donations/entities/donor.entity';
import { Beneficiary } from '../beneficiaries/entities/beneficiary.entity';
import { ActivityLogService } from '../admin/activity-log.service';
import { NotificationService } from '../notifications/services/notifications.service';
import { TokenBlacklistService } from '../auth/token-blacklist.service';

@Injectable()
export class UsersService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Donor)
    private donorsRepository: Repository<Donor>,
    @InjectRepository(Beneficiary)
    private beneficiariesRepository: Repository<Beneficiary>,
    private activityLogService: ActivityLogService,
    private notificationService: NotificationService, 
    private tokenBlacklistService : TokenBlacklistService

  ) {
    super(usersRepository);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async findByEmailOrPhone(identifier: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.findOne(id);
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async searchUsers(query: string, paginationParams: PaginationParams) {
    const where = query
      ? [
          { email: query },
          { phone: query },
          { fullName: query },
        ]
      : undefined;

    return this.paginate(paginationParams, where);
  }

   async getUsersByType(userType: string, paginationParams: PaginationParams) {
    // Validate and cast the userType string to UserType enum
    if (!Object.values(UserType).includes(userType as UserType)) {
      throw new NotFoundException(`Invalid user type: ${userType}`);
    }
    
    const where: FindOptionsWhere<User> = { 
      userType: userType as UserType 
    };
    
    return this.paginate(paginationParams, where);
  }

  async countUsersByType(userType?: string): Promise<number> {
    let where: FindOptionsWhere<User> | undefined;
    
    if (userType) {
      if (!Object.values(UserType).includes(userType as UserType)) {
        throw new NotFoundException(`Invalid user type: ${userType}`);
      }
      
      where = { userType: userType as UserType };
    }
    
    return this.count(where);
  }
   async findUserWithRelations(id: string, relations: string[] = []): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations,
    });
  }

  async findUsersWithRoles(paginationParams: PaginationParams, roles?: string[]) {
    const where: FindOptionsWhere<User>[] = [];
    
    if (roles && roles.length > 0) {
      // Validate each role
      const validRoles = roles.filter(role => 
        Object.values(UserType).includes(role as UserType)
      );
      
      if (validRoles.length > 0) {
        where.push(...validRoles.map(role => ({ userType: role as UserType })));
      }
    }
    
    return this.paginate(paginationParams, where.length > 0 ? where : undefined);
  }
   async activateUser(userId: string, activateDto: ActivateUserDto, adminId?: string): Promise<User> {
    const user = await this.usersRepository.findOne({ 
      where: { id: userId },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = activateDto.isActive;
    const updatedUser = await this.usersRepository.save(user);

    // ✅ INVALIDATE ALL USER TOKENS WHEN DEACTIVATING
    if (!activateDto.isActive) {
      try {
        // You need to inject TokenBlacklistService
        await this.tokenBlacklistService.blacklistAllUserTokens(userId);
      } catch (error) {
        console.error('Failed to blacklist user tokens:', error);
      }
    }

    // Log the activation/deactivation
    await this.activityLogService.logActivity(
      adminId || 'system', // Use adminId if provided
      activateDto.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      'users',
      userId,
      null,
      { 
        reason: activateDto.reason,
        userType: user.userType,
        actionBy: adminId ? 'admin' : 'system'
      },
      activateDto.isActive 
        ? `User activated by admin. Reason: ${activateDto.reason || 'No reason provided'}`
        : `User deactivated by admin. Reason: ${activateDto.reason || 'No reason provided'}`
    );

    // Send notification to user about activation status
    if (activateDto.isActive) {
      await this.notificationService.sendAccountActivatedNotification(
        userId,
        user.language
      );
    } else {
      await this.notificationService.sendAccountDeactivatedNotification(
        userId,
        user.language,
        activateDto.reason
      );
    }

    return updatedUser;
  }

  async getPendingActivationUsers(paginationParams: PaginationParams): Promise<PaginatedResponse<User>> {
    const where: FindOptionsWhere<User> = { 
      isActive: false,
      isVerified: true, // Only show verified users pending activation
      userType: In([UserType.DONOR, UserType.BENEFICIARY]) // Exclude admin
    };
    
    return this.paginate(paginationParams, where);
  }

  async getUserStatus(userId: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Determine account status
    let status = 'ACTIVE';
    if (!user.isVerified) status = 'UNVERIFIED';
    else if (!user.isActive) status = 'PENDING_ACTIVATION';

    // Get profile completion status
    let profileCompletion = {};
    if (user.userType === UserType.DONOR) {
      const donor = await this.donorsRepository.findOne({ where: { user: { id: userId } } });
      profileCompletion = this.calculateDonorProfileCompletion(donor);
    } else if (user.userType === UserType.BENEFICIARY) {
      const beneficiary = await this.beneficiariesRepository.findOne({ 
        where: { user: { id: userId } } 
      });
      profileCompletion = this.calculateBeneficiaryProfileCompletion(beneficiary);
    }

    return {
      userId: user.id,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      isVerified: user.isVerified,
      isActive: user.isActive,
      verifiedAt: user.verifiedAt,
      lastLoginAt: user.lastLoginAt,
      accountStatus: status,
      profileCompletion,
      createdAt: user.createdAt,
    };
  }

  // Add these helper methods
  private calculateDonorProfileCompletion(donor: any): any {
    if (!donor) return { percentage: 0, missingFields: ['profile'] };
    
    const fields = [
      'fullName',
      'country',
      'preferredCurrency',
      'receiptPreference',
    ];
    
    const completed = fields.filter(field => donor[field]);
    const percentage = (completed.length / fields.length) * 100;
    
    return {
      percentage: Math.round(percentage),
      completedFields: completed,
      missingFields: fields.filter(field => !donor[field]),
    };
  }

  private calculateBeneficiaryProfileCompletion(beneficiary: any): any {
    if (!beneficiary) return { percentage: 0, missingFields: ['profile'] };
    
    const fields = [
      'fullName',
      'dateOfBirth',
      'location',
      'businessType',
      'startCapital',
      'trackingFrequency',
    ];
    
    const completed = fields.filter(field => beneficiary[field]);
    const percentage = (completed.length / fields.length) * 100;
    
    return {
      percentage: Math.round(percentage),
      completedFields: completed,
      missingFields: fields.filter(field => !beneficiary[field]),
    };
  }
}