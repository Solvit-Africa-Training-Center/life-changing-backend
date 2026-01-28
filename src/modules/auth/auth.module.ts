import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { User } from '../users/entities/user.entity';
import { Donor } from '../donations/entities/donor.entity';
import { Staff } from '../users/entities/staff.entity';
import { Beneficiary } from '../beneficiaries/entities/beneficiary.entity';
import { Helpers } from '../../shared/utils/helpers';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Donor, Staff, Beneficiary]),
    UsersModule,
    PassportModule,
    NotificationsModule,
    AdminModule,
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
    UsersService,
    JwtStrategy,
    RefreshTokenStrategy,
    LocalStrategy,
    Helpers,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
