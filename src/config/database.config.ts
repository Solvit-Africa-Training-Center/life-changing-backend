import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Beneficiary } from '../modules/beneficiaries/entities/beneficiary.entity';
import { Donor } from '../modules/donations/entities/donor.entity';
import { Staff } from '../modules/users/entities/staff.entity';
import { Program } from '../modules/programs/entities/program.entity';
import { Project } from '../modules/programs/entities/project.entity';
import { Donation } from '../modules/donations/entities/donation.entity';
import { RecurringDonation } from '../modules/donations/entities/recurring-donation.entity';
import { WeeklyTracking } from '../modules/beneficiaries/entities/weekly-tracking.entity';
import { Goal } from '../modules/beneficiaries/entities/goal.entity';
import { UssdSession } from '../modules/ussd/entities/ussd-session.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';
import { Story } from '../modules/content/entities/story.entity';
import { ActivityLog } from '../modules/admin/entities/activity-log.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('config.database.host'),
      port: this.configService.get('config.database.port'),
      username: this.configService.get('config.database.username'),
      password: this.configService.get('config.database.password'),
      database: this.configService.get('config.database.database'),
      entities: [
        User,
        Beneficiary,
        Donor,
        Staff,
        Program,
        Project,
        Donation,
        RecurringDonation,
        WeeklyTracking,
        Goal,
        UssdSession,
        Notification,
        Story,
        ActivityLog,
      ],
      synchronize: this.configService.get('config.database.synchronize'),
      logging: this.configService.get('config.database.logging'),
      migrations: ['dist/migrations/*.js'],
      migrationsRun: true,
      cli: {
        migrationsDir: 'src/migrations',
      },
    };
  }
}