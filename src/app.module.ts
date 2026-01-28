import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ConfigurationModule } from './config/configuration.module';
import { DatabaseModule } from './shared/database/database.module';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BeneficiariesModule } from './modules/beneficiaries/beneficiaries.module';
import { DonationsModule } from './modules/donations/donations.module';
import { ProgramsModule } from './modules/programs/programs.module';
import { UssdModule } from './modules/ussd/ussd.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ContentModule } from './modules/content/content.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';



@Module({
  imports: [
    // Core modules
    ConfigurationModule,
    DatabaseModule,
    
    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute in milliseconds
      limit: 100, // 100 requests per ttl
    }]),
    
    // Health checks
    TerminusModule,
    
    // Task scheduling
    ScheduleModule.forRoot(),
    
    // Queue processing
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('config.redis.host') || 'localhost',
          port: configService.get('config.redis.port') || 6379,
          password: configService.get('config.redis.password'),
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 100,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    BeneficiariesModule,
    DonationsModule,
    ProgramsModule,
    UssdModule,
    AnalyticsModule,
    AdminModule,
    NotificationsModule,
    ContentModule,
    WebhooksModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggingMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}