import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

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
import { AuthResponse, LoginResponse, RegisterResponse } from './interfaces/auth-response.interface';
import { UserType } from '../../config/constants';
import { Donor } from '../donations/entities/donor.entity';
import { Staff } from '../users/entities/staff.entity';
import { Beneficiary } from '../beneficiaries/entities/beneficiary.entity';

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
  ) {}

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

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, phone, password, deviceId } = loginDto;
    
    if (!email && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const identifier = email || phone;
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

    const tokens = await this.generateTokens(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens,
      requiresVerification: !user.isVerified,
    };
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    const { email, phone, password, fullName, userType, language, deviceId } = registerDto;

    // Check if user already exists
    const existingUser = await this.usersService.findByEmailOrPhone(email || phone);
    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Format phone number
    const formattedPhone = this.helpers.formatPhoneNumber(phone);

    // Create user
    const user = this.usersRepository.create({
      email,
      phone: formattedPhone,
      password,
      userType,
      language: language || 'en',
      isVerified: false, // Require email/phone verification
      verificationToken: this.helpers.generateRandomToken(),
    });

    await this.usersRepository.save(user);

    // Create profile based on user type
    await this.createUserProfile(user, fullName, userType);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Send verification email/SMS
    await this.sendVerification(user);

    return {
      user: userWithoutPassword,
      tokens,
      verificationRequired: true,
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
        // Staff profile for admins
        const staff = this.staffRepository.create({
          user,
          fullName,
          role: 'admin',
          permissions: ['*'], // All permissions
        });
        await this.staffRepository.save(staff);
        break;
    }
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<Tokens> {
    try {
      const { refreshToken } = refreshTokenDto;
      
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('config.jwt.refreshSecret'),
      });

      const user = await this.usersService.findById(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email, phone } = forgotPasswordDto;
    
    if (!email && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const user = await this.usersService.findByEmailOrPhone(email || phone);
    
    if (!user) {
      // Don't reveal that user doesn't exist for security
      return { message: 'If an account exists, a reset link will be sent' };
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = this.helpers.generateRandomToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    
    await this.usersRepository.save(user);

    // Send reset email/SMS
    await this.sendPasswordReset(user, resetToken);

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
        resetPasswordExpires: new Date(Date.now()),
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    
    await this.usersRepository.save(user);

    // Invalidate all existing tokens (optional - for security)
    // You could implement token blacklisting here

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

    return { message: 'Account verified successfully' };
  }

  async logout(userId: string): Promise<{ message: string }> {
    // In production, you might want to:
    // 1. Add token to blacklist
    // 2. Clear refresh token from user
    // 3. Log the logout event
    
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: User): Promise<Tokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      isVerified: user.isVerified,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('config.jwt.secret'),
        expiresIn: this.configService.get('config.jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('config.jwt.refreshSecret'),
        expiresIn: this.configService.get('config.jwt.refreshExpiresIn'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 24 * 60 * 60, // 24 hours in seconds
      tokenType: 'Bearer',
    };
  }

  private async sendVerification(user: User): Promise<void> {
    // Implementation depends on your notification service
    // For now, we'll log it
    console.log(`Verification token for ${user.email || user.phone}: ${user.verificationToken}`);
    
    // In production:
    // 1. Send email verification link
    // 2. Or send SMS verification code
  }

  private async sendPasswordReset(user: User, token: string): Promise<void> {
    // Implementation depends on your notification service
    console.log(`Password reset token for ${user.email || user.phone}: ${token}`);
    
    // In production:
    // 1. Send email with reset link
    // 2. Or send SMS with reset code
  }
}
