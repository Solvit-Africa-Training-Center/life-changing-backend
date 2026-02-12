// src/modules/auth/services/password.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { Helpers } from '../../../shared/utils/helpers';
import { NotificationService } from '../../notifications/services/notifications.service';
import { ActivityLogService } from '../../admin/activity-log.service';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class PasswordService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private usersService: UsersService,
    private helpers: Helpers,
    private notificationService: NotificationService,
    private activityLogService: ActivityLogService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email, phone } = forgotPasswordDto;

    if (!email && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const identifier = this.getIdentifier(email, phone);
    // const user = await this.usersService.findByEmailOrPhone(identifier);
    // FIX 1: Try to find user by email first, then by phone
    let user: User | null = null;
    
    if (email) {
      user = await this.usersService.findByEmail(email);
    }
    
    if (!user && phone) {
      user = await this.usersService.findByPhone(phone);
    }

    if (!user) {
      return { message: 'If an account exists, a reset link will be sent' };
    }

    const resetToken = this.helpers.generateRandomToken();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);

    await this.usersRepository.save(user);

    // Send in-app notification
    await this.notificationService.sendPasswordResetNotification(
      user.id,
      user.language
    );

    // Send external reset email/SMS (queued)
    await this.sendPasswordReset(user, resetToken);

    // Log password reset request
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

    // Invalidate all existing tokens
    await this.tokenBlacklistService.blacklistAllUserTokens(user.id);

    // Log password reset completion
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

  private getIdentifier(email?: string, phone?: string): string {
    if (email) return email;
    if (phone) return phone;
    throw new BadRequestException('Valid identifier is required');
  }

  private async sendPasswordReset(user: User, token: string): Promise<void> {
    try {
       if (user.email) {
        await this.notificationService.sendPasswordResetEmail(user.email, token);
        console.log(`📧 Password reset email queued for ${user.email}`);
      }
      
      // Send SMS if user has phone - ALWAYS send this too!
      if (user.phone) {
        await this.notificationService.sendPasswordResetSMS(user.phone, token);
        console.log(`📱 Password reset SMS queued for ${user.phone}`);
      }
    } catch (error) {
      console.error('Failed to queue password reset:', error);
    }
  }
}