import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ActivityLog } from 'src/modules/admin/entities/activity-log.entity';
import { Beneficiary } from 'src/modules/beneficiaries/entities/beneficiary.entity';
import { Goal } from 'src/modules/beneficiaries/entities/goal.entity';
import { WeeklyTracking } from 'src/modules/beneficiaries/entities/weekly-tracking.entity';
import { Story } from 'src/modules/content/entities/story.entity';
import { Donation } from 'src/modules/donations/entities/donation.entity';
import { Donor } from 'src/modules/donations/entities/donor.entity';
import { RecurringDonation } from 'src/modules/donations/entities/recurring-donation.entity';
import { Program } from 'src/modules/programs/entities/program.entity';
import { Project } from 'src/modules/programs/entities/project.entity';
import { Staff } from 'src/modules/users/entities/staff.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { UssdSession } from 'src/modules/ussd/entities/ussd-session.entity';

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
      maxQueryExecutionTime: 1000, // Log queries taking longer than 1s
      poolSize: 10, // Connection pool size
      extra: {
        max: 20, // Maximum number of connections
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      },
    };
  }
}