// src/modules/donations/donations.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonorsController } from './controllers/donors.controller';
import { DonationsController } from './controllers/donations.controller';
import { DonorsService } from './services/donors.service';
import { DonationsService } from './services/donations.service';
import { Donor } from './entities/donor.entity';
import { Donation } from './entities/donation.entity';
import { RecurringDonation } from './entities/recurring-donation.entity';
import { UsersModule } from '../users/users.module';
import { ProgramsModule } from '../programs/programs.module';
import { User } from '../users/entities/user.entity';
import { Project } from '../programs/entities/project.entity';
import { Program } from '../programs/entities/program.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Donor, Donation, RecurringDonation, User,  Project, // Add this
      Program]),
    forwardRef(() => UsersModule),
    forwardRef(() => ProgramsModule), 
    NotificationsModule
  ],
  controllers: [
    DonorsController, 
    DonationsController, 
  ],
  providers: [
    DonorsService, 
    DonationsService, 
  ],
  exports: [DonorsService, DonationsService],
})
export class DonationsModule {}
