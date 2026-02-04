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
import { ActivityLog } from '../admin/entities/activity-log.entity';
import { ActivityLogService } from '../admin/activity-log.service';
import { NotificationService } from '../notifications/services/notifications.service';

@Module({
   imports: [TypeOrmModule.forFeature([
      User,  
      Donor,
      Beneficiary,
      ActivityLog,
    ]),
    forwardRef(() => DonationsModule),
    forwardRef(() => BeneficiariesModule),
    forwardRef(() => AdminModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [
    UsersService,
    ActivityLogService,
    NotificationService, 
  ],
})
export class UsersModule {}
