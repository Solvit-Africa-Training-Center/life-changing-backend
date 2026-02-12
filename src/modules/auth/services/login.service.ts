// src/modules/auth/services/login.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { ActivityLogService } from '../../admin/activity-log.service';
import { LoginDto } from '../dto/login.dto';
import { LoginResponse } from '../interfaces/auth-response.interface';
import { UserType } from '../../../config/constants';
import { Staff } from '../../admin/entities/staff.entity';
import { TokenService } from './token.service';

@Injectable()
export class LoginService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
       @InjectRepository(Staff)
        private staffRepository: Repository<Staff>,
    private tokenService: TokenService,
    private activityLogService: ActivityLogService,
  ) {}

  async login(loginDto: LoginDto, user: User): Promise<LoginResponse> {
    const { deviceId } = loginDto;

    // Check if account is verified (except admin)
    if (user.userType !== UserType.ADMIN && !user.isVerified) {
      throw new UnauthorizedException('Please verify your account first');
    }

    // Check if account is activated
    if (!user.isActive) {
      throw new UnauthorizedException('Account is pending admin activation');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    // Check if admin has completed staff profile
    let requiresStaffProfile = false;
    if (user.userType === UserType.ADMIN) {
      const staffProfile = await this.staffRepository.findOne({
        where: { user: { id: user.id } }
      });
      requiresStaffProfile = !staffProfile; // true if no staff profile
    }

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

    const tokens = await this.tokenService.generateTokens(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as any,
      tokens,
      requiresVerification: user.userType !== UserType.ADMIN && !user.isVerified,
      requiresStaffProfile,
    };
  }
}