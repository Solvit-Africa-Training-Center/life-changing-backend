// src/modules/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { AfricasTalkingService } from './africas-talking.service';
import { NotificationsController } from './notifications.controller';
import { NotificationService } from './notifications.service';
import { NotificationsProcessor } from './processors/notifications.processor';
import { Notif } from './entities/notification.entity';

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
    AfricasTalkingService,
    NotificationsProcessor,
  ],
  exports: [NotificationService, AfricasTalkingService],
})
export class NotificationsModule {}