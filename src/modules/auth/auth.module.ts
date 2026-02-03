// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { User } from '../users/entities/user.entity';
import { Donor } from '../donations/entities/donor.entity';
import { Staff } from '../users/entities/staff.entity';
import { Beneficiary } from '../beneficiaries/entities/beneficiary.entity';
import { Helpers } from '../../shared/utils/helpers';
import { NotificationsModule } from '../notifications/notifications.module';
import { TokenBlacklistService } from './token-blacklist.service';
import { ActivityLog } from '../admin/entities/activity-log.entity';
import { ActivityLogService } from '../admin/activity-log.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Donor, Staff, Beneficiary,ActivityLog]),
    UsersModule,
    PassportModule,
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('config.jwt.secret'),
        signOptions: {
          expiresIn: configService.get('config.jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshTokenStrategy,
    LocalStrategy,
    Helpers,
    TokenBlacklistService,
    ActivityLogService
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}