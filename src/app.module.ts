import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';

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
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    // Add RedisModule here
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isDocker = process.env.DOCKER === 'true';
        return {
          type: 'single',
          // Use service name in Docker, external IP on local
          url: isDocker
            ? `redis://redis:6379`  // Docker internal
            : `redis://${configService.get('config.redis.host')}:${configService.get('config.redis.port')}`,
          options: {
            password: configService.get('config.redis.password'),
          },
        };
      },
      inject: [ConfigService],
    }),

    // Core modules
    ConfigurationModule,
    DatabaseModule,

    // Rate limiting
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60, // seconds (IMPORTANT: throttler uses seconds)
          limit: 100,
        },
      ],
    }),

    // Health checks
    TerminusModule,

    // Task scheduling
    ScheduleModule.forRoot(),

    // Queue processing
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isDocker = process.env.DOCKER === 'true';
        return {
          redis: {
            host: isDocker
              ? 'redis'  // Docker service name
              : configService.get('config.redis.host') || 'localhost',
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
        }
      },
      inject: [ConfigService],
    }),

    BullModule.registerQueue({
      name: 'notifications',
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    SharedModule,
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
    consumer.apply(LoggingMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
