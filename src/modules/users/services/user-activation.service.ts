// src/modules/users/services/user-activation.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { ActivateUserDto } from '../dto/activate-user.dto';
import { ActivityLogService } from '../../admin/activity-log.service';
import { NotificationService } from '../../notifications/services/notifications.service';
import { TokenBlacklistService } from '../../auth/services/token-blacklist.service';
import { Language } from '../../../config/constants';

@Injectable()
export class UserActivationService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private activityLogService: ActivityLogService,
    private notificationService: NotificationService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {}

  async activateUser(
    userId: string, 
    activateDto: ActivateUserDto, 
    adminId?: string
  ): Promise<User> {
    const user = await this.getUserById(userId);
    
    user.isActive = activateDto.isActive;
    const updatedUser = await this.usersRepository.save(user);

    await this.handleTokenBlacklist(userId, activateDto.isActive);
    await this.logActivationActivity(userId, activateDto, adminId, user.userType);
    await this.sendActivationNotification(userId, user.language, activateDto);

    return updatedUser;
  }

  private async getUserById(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ 
      where: { id: userId },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async handleTokenBlacklist(userId: string, isActive: boolean): Promise<void> {
    if (!isActive) {
      try {
        await this.tokenBlacklistService.blacklistAllUserTokens(userId);
      } catch (error) {
        console.error('Failed to blacklist user tokens:', error);
      }
    }
  }

  private async logActivationActivity(
    userId: string,
    activateDto: ActivateUserDto,
    adminId: string | undefined,
    userType: string
  ): Promise<void> {
    const activityType = activateDto.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED';
    const actionBy = adminId ? 'admin' : 'system';

    await this.activityLogService.logActivity(
      adminId || 'system',
      activityType,
      'users',
      userId,
      null,
      { 
        reason: activateDto.reason,
        userType,
        actionBy
      },
      activateDto.isActive 
        ? `User activated by admin. Reason: ${activateDto.reason || 'No reason provided'}`
        : `User deactivated by admin. Reason: ${activateDto.reason || 'No reason provided'}`
    );
  }

  private async sendActivationNotification(
    userId: string,
    language: Language,
    activateDto: ActivateUserDto
  ): Promise<void> {
    if (activateDto.isActive) {
      await this.notificationService.sendAccountActivatedNotification(userId, language);
    } else {
      await this.notificationService.sendAccountDeactivatedNotification(
        userId,
        language,
        activateDto.reason
      );
    }
  }
}