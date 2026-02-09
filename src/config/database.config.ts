import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

import { ActivityLog } from '../modules/admin/entities/activity-log.entity';
import { Beneficiary } from '../modules/beneficiaries/entities/beneficiary.entity';
import { BeneficiaryDocument } from '../modules/beneficiaries/entities/beneficiary-document.entity';
import { EmergencyContact } from '../modules/beneficiaries/entities/emergency-contact.entity';
import { Goal } from '../modules/beneficiaries/entities/goal.entity';
import { WeeklyTracking } from '../modules/beneficiaries/entities/weekly-tracking.entity';
import { Story } from '../modules/content/entities/story.entity';
import { Donation } from '../modules/donations/entities/donation.entity';
import { Donor } from '../modules/donations/entities/donor.entity';
import { RecurringDonation } from '../modules/donations/entities/recurring-donation.entity';
import { ImpactMetric } from '../modules/programs/entities/impact-metric.entity';
import { Program } from '../modules/programs/entities/program.entity';
import { Project } from '../modules/programs/entities/project.entity';
import { Notif } from '../modules/notifications/entities/notification.entity';
import { Staff } from '../modules/admin/entities/staff.entity';
import { User } from '../modules/users/entities/user.entity';
import { UssdSession } from '../modules/ussd/entities/ussd-session.entity';
import { WebhookEvent } from '../modules/webhooks/entities/webhook-event.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    
    const isDocker = process.env.DOCKER === 'true';

    return {
      type: 'postgres',
      host: isDocker ? 'postgres' : this.configService.get('config.database.host'),
      port: isDocker ? 5432 : this.configService.get('config.database.port'),
      username: this.configService.get('config.database.username'),
      password: this.configService.get('config.database.password'),
      database: this.configService.get('config.database.database'),

      entities: [
        // User Management
        User,
        Staff,

        // Beneficiary Management
        Beneficiary,
        WeeklyTracking,
        Goal,
        BeneficiaryDocument,
        EmergencyContact,

        // Donation Management
        Donor,
        Donation,
        RecurringDonation,

        // Program Management
        Program,
        Project,
        ImpactMetric,

        // Communication & Integration
        UssdSession,

        Notif,

        // Content Management
        Story,

        // System & Admin
        ActivityLog,

        // Integration (Critical!)
        WebhookEvent,
      ],

      synchronize: this.configService.get('config.database.synchronize'),
      logging: this.configService.get('config.database.logging'),
      migrations: ['dist/migrations/*.js'],
      migrationsRun: true,
      maxQueryExecutionTime: 1000,
      poolSize: 10,
      extra: {
        max: 20,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      },
    };
  }
}
