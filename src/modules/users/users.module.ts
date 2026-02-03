import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { DonationsModule } from '../donations/donations.module';
import { BeneficiariesModule } from '../beneficiaries/beneficiaries.module';
import { AdminModule } from '../admin/admin.module';

@Module({
   imports: [TypeOrmModule.forFeature([User]),
    forwardRef(() => DonationsModule),
    forwardRef(() => BeneficiariesModule),
    forwardRef(() => AdminModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
