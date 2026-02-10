import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { DonationsModule } from '../donations/donations.module';
import { BeneficiariesModule } from '../beneficiaries/beneficiaries.module';
import { AdminModule } from '../admin/admin.module';
import { Donor } from '../donations/entities/donor.entity';
import { Beneficiary } from '../beneficiaries/entities/beneficiary.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { UserQueryService } from './services/user-query.service';
import { UserTypeService } from './services/user-type.service';
import { UserProfileService } from './services/user-profile.service';
import { UserActivationService } from './services/user-activation.service';
import { UserStatusService } from './services/user-status.service';


@Module({
  imports: [TypeOrmModule.forFeature([
    User,
    Donor,
    Beneficiary
  ]),
  forwardRef(() => DonationsModule),
  forwardRef(() => BeneficiariesModule),
  forwardRef(() => AdminModule),
  forwardRef(() => AuthModule),
    NotificationsModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserQueryService,
    UserTypeService,
    UserProfileService,
    UserActivationService,
    UserStatusService,
  ],
  exports: [UsersService],
})
export class UsersModule { }
