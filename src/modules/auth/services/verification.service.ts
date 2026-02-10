// src/modules/auth/services/verification.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../users/entities/user.entity';
import { ActivityLogService } from '../../admin/activity-log.service';
import { VerifyAccountDto } from '../dto/verify-account.dto';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private activityLogService: ActivityLogService,
  ) {}

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

    // Log account verification
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
}