<<<<<<< HEAD
import { Module } from '@nestjs/common';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';

@Module({
  controllers: [DonationsController],
  providers: [DonationsService]
=======
// src/modules/donations/donations.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonorsController } from './controllers/donors.controller';
import { DonationsController } from './controllers/donations.controller';
// import { RecurringDonationsController } from './controllers/recurring-donations.controller';
import { DonorsService } from './services/donors.service';
import { DonationsService } from './services/donations.service';
// import { RecurringDonationsService } from './services/recurring-donations.service';
import { Donor } from './entities/donor.entity';
import { Donation } from './entities/donation.entity';
import { RecurringDonation } from './entities/recurring-donation.entity';
import { UsersModule } from '../users/users.module';
import { ProgramsModule } from '../programs/programs.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Donor, Donation, RecurringDonation, User]),
    forwardRef(() => UsersModule),
    forwardRef(() => ProgramsModule), 
  ],
  controllers: [
    DonorsController, 
    DonationsController, 
    // RecurringDonationsController
  ],
  providers: [
    DonorsService, 
    DonationsService, 
    // RecurringDonationsService
  ],
  exports: [DonorsService, DonationsService],
>>>>>>> origin/dev
})
export class DonationsModule {}
