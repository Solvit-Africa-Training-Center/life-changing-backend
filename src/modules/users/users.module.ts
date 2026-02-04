import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { DonationsModule } from '../donations/donations.module';
import { BeneficiariesModule } from '../beneficiaries/beneficiaries.module';
import { AdminModule } from '../admin/admin.module';
import { Donor } from '../donations/entities/donor.entity';
import { Beneficiary } from '../beneficiaries/entities/beneficiary.entity';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

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
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
