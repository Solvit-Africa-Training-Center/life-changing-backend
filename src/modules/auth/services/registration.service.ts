// src/modules/auth/services/registration.service.ts
import { Injectable, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { Helpers } from '../../../shared/utils/helpers';
import { NotificationService } from '../../notifications/services/notifications.service';
import { ActivityLogService } from '../../admin/activity-log.service';
import { TokenService } from './token.service';
import { RegisterDto } from '../dto/register.dto';
import { RegisterResponse } from '../interfaces/auth-response.interface';
import { Language, UserType } from '../../../config/constants';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private usersService: UsersService,
    private helpers: Helpers,
    private notificationService: NotificationService,
    private activityLogService: ActivityLogService,
    private tokenService: TokenService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    const { email, phone, password, fullName, userType, language, deviceId } = registerDto;

    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }

    // Default to BENEFICIARY if no role specified
    const finalUserType = userType || UserType.BENEFICIARY;

    // Prevent admin registration through public endpoint
    if (finalUserType === UserType.ADMIN) {
      throw new ForbiddenException('Admin registration is not allowed');
    }

    // Check if user already exists
    const identifier = email || phone;
    const existingUser = await this.usersService.findByEmailOrPhone(identifier);
    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Format phone number
    const formattedPhone = this.helpers.formatPhoneNumber(phone);

    // Create user
    const user = await this.createUser({
      email,
      phone: formattedPhone,
      fullName,
      password,
      userType: finalUserType,
      language,
    });

    // Generate tokens
    const tokens = await this.tokenService.generateTokens(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Send welcome notification (in-app, queued)
    await this.notificationService.sendWelcomeNotification(
      user.id,
      user.userType,
      user.language
    );

    // Send verification email/SMS (external, queued)
    await this.sendVerification(user);

    // Log registration activity
    await this.activityLogService.logActivity(
      user.id,
      'USER_REGISTER',
      'users',
      user.id,
      null,
      { userType: finalUserType, timestamp: new Date().toISOString() },
      'New user registered'
    );

    return {
      user: userWithoutPassword as any,
      tokens,
      verificationRequired: true,
    };
  }

  private async createUser(userData: {
    email?: string;
    phone: string;
    fullName: string;
    password: string;
    userType: UserType;
    language?: string;
  }): Promise<User> {
    const user = this.usersRepository.create({
      email: userData.email || null,
      phone: userData.phone,
      fullName: userData.fullName,
      password: userData.password,
      userType: userData.userType,
      language: this.parseLanguage(userData.language),
      isVerified: false,
      isActive: false,
      verificationToken: this.helpers.generateRandomToken(),
    });

    return await this.usersRepository.save(user);
  }

  private async sendVerification(user: User): Promise<void> {
    try {
      if (user.email) {
        await this.notificationService.sendEmailVerification(user.email, user.verificationToken!);
      } else if (user.phone) {
        await this.notificationService.sendSMSVerification(user.phone, user.verificationToken!);
      }
    } catch (error) {
      console.error('Failed to queue verification:', error);
    }
  }

  private parseLanguage(lang?: string): Language {
    if (!lang) return Language.EN;

    const normalized = lang.toLowerCase();
    if (normalized === 'rw' || normalized === 'kinyarwanda') {
      return Language.RW;
    }
    return Language.EN;
  }
}