import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  BadRequestException, 
  NotFoundException,
  InternalServerErrorException 
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { StringValue } from 'ms';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { Helpers } from '../../shared/utils/helpers';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyAccountDto } from './dto/verify-account.dto';
import { Tokens, JwtPayload } from './interfaces/tokens.interface';
import { LoginResponse, RegisterResponse } from './interfaces/auth-response.interface';
import { Language, StaffRole, UserType } from '../../config/constants';
import { Donor } from '../donations/entities/donor.entity';
import { Staff } from '../users/entities/staff.entity';
import { Beneficiary } from '../beneficiaries/entities/beneficiary.entity';
import { NotificationService } from '../notifications/notifications.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { ActivityLogService } from '../admin/activity-log.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Donor)
    private donorsRepository: Repository<Donor>,
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
    @InjectRepository(Beneficiary)
    private beneficiariesRepository: Repository<Beneficiary>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private helpers: Helpers,
    private notificationService: NotificationService,
    private tokenBlacklistService: TokenBlacklistService,
    private activityLogService: ActivityLogService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, phone, password, deviceId } = loginDto;
    
    if (!email && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const identifier = email || phone;
    if (!identifier) {
      throw new BadRequestException('Valid identifier is required');
    }

    const user = await this.validateUser(identifier, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    // Log login activity
    await this.activityLogService.logActivity(
      user.id,
      'USER_LOGIN',
      'users',
      user.id,
      null,
      { deviceId, timestamp: new Date().toISOString() },
      'User logged in successfully'
    );

    const tokens = await this.generateTokens(user);

    // Store refresh token for blacklisting
    await this.tokenBlacklistService.storeUserToken(
      user.id,
      tokens.refreshToken,
      7 * 24 * 60 * 60 // 7 days in seconds
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as any,
      tokens,
      requiresVerification: !user.isVerified,
    };
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    const { email, phone, password, fullName, userType, language, deviceId } = registerDto;

    if (!phone) {
      throw new BadRequestException('Phone number is required');
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
    const userData: Partial<User> = {
      email: email || null,
      phone: formattedPhone,
      password,
      userType,
      language: this.parseLanguage(language),
      isVerified: false,
      verificationToken: this.helpers.generateRandomToken(),
    };

    const user = this.usersRepository.create(userData as User);
    await this.usersRepository.save(user);

    // Create profile based on user type
    try {
      await this.createUserProfile(user, fullName, userType);
    } catch (error) {
      // Rollback if profile creation fails
      await this.usersRepository.delete(user.id);
      throw new InternalServerErrorException('Failed to create user profile');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Store refresh token for blacklisting
    await this.tokenBlacklistService.storeUserToken(
      user.id,
      tokens.refreshToken,
      7 * 24 * 60 * 60
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Send welcome notification
    await this.notificationService.sendWelcomeNotification(
      user.id,
      user.userType,
      user.language
    );

    // Send verification email/SMS
    await this.sendVerification(user);

    // Log registration activity
    await this.activityLogService.logActivity(
      user.id,
      'USER_REGISTER',
      'users',
      user.id,
      null,
      { userType, timestamp: new Date().toISOString() },
      'New user registered'
    );

    return {
      user: userWithoutPassword as any,
      tokens,
      verificationRequired: true,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<Tokens> {
    try {
      const { refreshToken } = refreshTokenDto;
      
      // Check if token is blacklisted
      const isBlacklisted = await this.tokenBlacklistService.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been invalidated');
      }

      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('config.jwt.refreshSecret') || 'default_refresh_secret',
      });

      const user = await this.usersService.findById(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Blacklist the old refresh token
      await this.tokenBlacklistService.blacklistToken(refreshToken, 7 * 24 * 60 * 60);

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Store new refresh token
      await this.tokenBlacklistService.storeUserToken(
        user.id,
        tokens.refreshToken,
        7 * 24 * 60 * 60
      );

      // Log token refresh activity
      await this.activityLogService.logActivity(
        user.id,
        'TOKEN_REFRESH',
        'users',
        user.id,
        null,
        { timestamp: new Date().toISOString() },
        'Refresh token used'
      );

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, accessToken: string, refreshToken?: string): Promise<{ message: string }> {
    // Blacklist the access token (expires in 24 hours)
    await this.tokenBlacklistService.blacklistToken(accessToken, 24 * 60 * 60);

    // Blacklist refresh token if provided
    if (refreshToken) {
      await this.tokenBlacklistService.blacklistToken(refreshToken, 7 * 24 * 60 * 60);
    }

    // Remove user's stored tokens
    await this.tokenBlacklistService.blacklistAllUserTokens(userId);

    // Log logout event
    await this.activityLogService.logActivity(
      userId,
      'USER_LOGOUT',
      'users',
      userId,
      null,
      { timestamp: new Date().toISOString() },
      'User logged out'
    );

    return { message: 'Logged out successfully' };
  }

  // Add this helper method
  async validateUser(identifier: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmailOrPhone(identifier);
    
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  private async generateTokens(user: User): Promise<Tokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      isVerified: user.isVerified,
    };

    // Check which method your JwtService has
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('config.jwt.secret'),
      expiresIn: (this.configService.get<string>('config.jwt.expiresIn') ??'24h') as StringValue,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('config.jwt.refreshSecret'),
       expiresIn: (this.configService.get<string>('config.jwt.refreshExpiresIn') ??'7d') as StringValue,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
      tokenType: 'Bearer',
    };
  }

  private async createUserProfile(user: User, fullName: string, userType: UserType): Promise<void> {
    switch (userType) {
      case UserType.DONOR:
        const donor = this.donorsRepository.create({
          user,
          fullName,
        });
        await this.donorsRepository.save(donor);
        break;

      case UserType.BENEFICIARY:
        const beneficiary = this.beneficiariesRepository.create({
          user,
          fullName,
          enrollmentDate: new Date(),
        });
        await this.beneficiariesRepository.save(beneficiary);
        break;

      case UserType.ADMIN:
        const staff = this.staffRepository.create({
          user,
          fullName,
          role: StaffRole.ADMIN,
          permissions: ['*'],
        });
        await this.staffRepository.save(staff);
        break;
      default:
        throw new BadRequestException(`Unsupported user type: ${userType}`);
    }
  }

  private async sendVerification(user: User): Promise<void> {
    try {
      if (user.email) {
        await this.notificationService.sendEmailVerification(user.email, user.verificationToken!);
      } else if (user.phone) {
        await this.notificationService.sendSMSVerification(user.phone, user.verificationToken!);
      }
    } catch (error) {
      console.error('Failed to send verification:', error);
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

  // Add other missing methods from previous implementation
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email, phone } = forgotPasswordDto;
    
    if (!email && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const getIdentifier = (): string => {
      if (email) return email;
      if (phone) return phone;
      throw new BadRequestException('Valid identifier is required');
    };

    const identifier = getIdentifier();
    const user = await this.usersService.findByEmailOrPhone(identifier);
    
    if (!user) {
      return { message: 'If an account exists, a reset link will be sent' };
    }

    const resetToken = this.helpers.generateRandomToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    
    await this.usersRepository.save(user);

    await this.notificationService.sendPasswordResetNotification(
      user.id,
      user.language
    );

    await this.sendPasswordReset(user, resetToken);

    await this.activityLogService.logActivity(
      user.id,
      'PASSWORD_RESET_REQUEST',
      'users',
      user.id,
      null,
      { method: email ? 'email' : 'sms', timestamp: new Date().toISOString() },
      'Password reset requested'
    );

    return { message: 'Password reset instructions sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.usersRepository.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: MoreThanOrEqual(new Date()),
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    
    await this.usersRepository.save(user);

    await this.tokenBlacklistService.blacklistAllUserTokens(user.id);

    await this.activityLogService.logActivity(
      user.id,
      'PASSWORD_RESET_COMPLETE',
      'users',
      user.id,
      null,
      { timestamp: new Date().toISOString() },
      'Password reset completed'
    );

    return { message: 'Password reset successfully' };
  }

  async verifyAccount(verifyAccountDto: VerifyAccountDto): Promise<{ message: string }> {
    const { token } = verifyAccountDto;

    const user = await this.usersRepository.findOne({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verifiedAt = new Date();
    
    await this.usersRepository.save(user);

    await this.activityLogService.logActivity(
      user.id,
      'ACCOUNT_VERIFIED',
      'users',
      user.id,
      null,
      { timestamp: new Date().toISOString() },
      'Account verified successfully'
    );

    return { message: 'Account verified successfully' };
  }

  private async sendPasswordReset(user: User, token: string): Promise<void> {
    try {
      if (user.email) {
        await this.notificationService.sendPasswordResetEmail(user.email, token);
      } else if (user.phone) {
        await this.notificationService.sendPasswordResetSMS(user.phone, token);
      }
    } catch (error) {
      console.error('Failed to send password reset:', error);
    }
  }
}
