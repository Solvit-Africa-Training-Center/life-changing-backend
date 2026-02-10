// src/modules/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { SMSService } from './services/sms.service';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from './services/notifications.service';
import { NotificationsProcessor } from './processors/notifications.processor';
import { Notif } from './entities/notification.entity';
import { EmailService } from './services/email.service';

import { NotificationFactoryService } from './services/notification-factory.service';
import { EmailNotificationService } from './services/email-notification.service';
import { SMSNotificationService } from './services/sms-notification.service';
import { InAppNotificationService } from './services/in-app-notification.service';
import { NotificationStatusService } from './services/notification-status.service';
import { NotificationQueryService } from './services/notification-query.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notif]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationService,

    NotificationFactoryService,
    EmailNotificationService,
    SMSNotificationService,
    InAppNotificationService,
    NotificationStatusService,
    NotificationQueryService,

    SMSService,
    EmailService,
    NotificationsProcessor,
  ],
  exports: [NotificationService, SMSService,EmailService],
})
export class NotificationsModule {}