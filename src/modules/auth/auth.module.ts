// src/modules/auth/auth.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { User } from '../users/entities/user.entity';
import { Donor } from '../donations/entities/donor.entity';
import { Staff } from '../admin/entities/staff.entity';
import { Beneficiary } from '../beneficiaries/entities/beneficiary.entity';
import { Helpers } from '../../shared/utils/helpers';
import { NotificationsModule } from '../notifications/notifications.module';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { ActivityLog } from '../admin/entities/activity-log.entity';
import { ActivityLogService } from '../admin/activity-log.service';
import { LoginService } from './services/login.service';
import { TokenService } from './services/token.service';
import { PasswordService } from './services/password.service';
import { VerificationService } from './services/verification.service';
import { RegistrationService } from './services/registration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Donor, Staff, Beneficiary, ActivityLog]),
    forwardRef(() => UsersModule),
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
    LoginService,
    RegistrationService,
    TokenService,
    PasswordService,
    VerificationService,
    JwtStrategy,
    RefreshTokenStrategy,
    LocalStrategy,
    Helpers,
    TokenBlacklistService,
    ActivityLogService,

  ],
  exports: [AuthService, JwtModule, TokenBlacklistService],
})
export class AuthModule { }