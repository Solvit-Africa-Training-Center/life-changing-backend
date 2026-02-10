// src/modules/auth/services/token.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { User } from '../../users/entities/user.entity';
import { ActivityLogService } from '../../admin/activity-log.service';
import { UsersService } from '../../users/services/users.service';
import { Tokens, JwtPayload } from '../interfaces/tokens.interface';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private tokenBlacklistService: TokenBlacklistService,
    private activityLogService: ActivityLogService,
    private usersService: UsersService,
  ) {}

  async generateTokens(user: User): Promise<Tokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      isVerified: user.isVerified,
    };

    const expiresIn = this.configService.get<string>('config.jwt.expiresIn') ?? '24h';
    const refreshExpiresIn = this.configService.get<string>('config.jwt.refreshExpiresIn') ?? '7d';

    const expiresInSeconds = Math.floor(ms(expiresIn as ms.StringValue) / 1000);
    const refreshExpiresInSeconds = Math.floor(ms(refreshExpiresIn as ms.StringValue) / 1000);

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('config.jwt.secret'),
      expiresIn: expiresInSeconds,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('config.jwt.refreshSecret'),
      expiresIn: refreshExpiresInSeconds,
    });

    // Store refresh token for blacklisting
    await this.tokenBlacklistService.storeUserToken(
      user.id,
      refreshToken,
      7 * 24 * 60 * 60 // 7 days in seconds
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
      tokenType: 'Bearer',
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
}