// src/modules/notifications/services/notification-factory.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Notif } from '../entities/notification.entity';
import { NotificationType, NotificationChannel, Language, NotificationStatus } from '../../../config/constants';

@Injectable()
export class NotificationFactoryService {
  constructor(
    @InjectRepository(Notif)
    private notificationsRepository: Repository<Notif>,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    title: { en: string; rw: string },
    message: { en: string; rw: string },
    channel: NotificationChannel = NotificationChannel.IN_APP,
    data?: Record<string, any>,
    scheduledFor?: Date,
  ): Promise<Notif> {
    const notification = this.notificationsRepository.create({
      user: { id: userId } as any,
      type,
      title,
      message,
      channel,
      data,
      scheduledFor,
      status: NotificationStatus.PENDING,
    });

    return await this.notificationsRepository.save(notification);
  }

  // Template methods for common notifications
  createWelcomeNotificationData(userType: string, language: Language = Language.EN): {
    title: { en: string; rw: string };
    message: { en: string; rw: string };
    data: Record<string, any>;
  } {
    return {
      title: {
        en: 'Welcome to LCEO!',
        rw: 'Murakaza neza LCEO!',
      },
      message: {
        en: `Thank you for joining LCEO as a ${userType}. We're excited to have you on board!`,
        rw: `Murakoze kwiyandikisha mu LCEO nk'${userType}. Turabashimiye kuba hamwe natwe!`,
      },
      data: { userType, language },
    };
  }

  createPasswordResetNotificationData(language: Language = Language.EN): {
    title: { en: string; rw: string };
    message: { en: string; rw: string };
    data: Record<string, any>;
  } {
    return {
      title: {
        en: 'Password Reset Requested',
        rw: 'Gusubiza ijambobanga Byasabye',
      },
      message: {
        en: 'A password reset has been requested for your account. If this was not you, please contact support.',
        rw: 'Gusubiza ijambobanga byasabywe kuri konte yawe. Ibi niba atari wowe, mwakire inkunga.',
      },
      data: { language },
    };
  }

  createAccountActivatedNotificationData(language: Language = Language.EN): {
    title: { en: string; rw: string };
    message: { en: string; rw: string };
    data: Record<string, any>;
  } {
    return {
      title: {
        en: 'Account Activated',
        rw: 'Konte Yemeretswe',
      },
      message: {
        en: 'Your account has been activated by the admin. You can now access all features.',
        rw: 'Konte yawe yemeretswe n\'umuyobozi. Ushobora noneho gukoresha ibikubiyemo byose.',
      },
      data: { language, type: 'account_activated' },
    };
  }

  createDonationReceiptNotificationData(
    amount: number,
    currency: string,
    projectName: string,
    language: Language = Language.EN
  ): {
    title: { en: string; rw: string };
    message: { en: string; rw: string };
    data: Record<string, any>;
  } {
    return {
      title: {
        en: 'Donation Confirmed',
        rw: 'Ubushobozi bwa donation bwarahamijwe',
      },
      message: {
        en: `Thank you for your donation of ${amount} ${currency} to ${projectName}. Your support is changing lives!`,
        rw: `Murakoze donation ya ${amount} ${currency} ku ${projectName}. Inkunga yawe irimo guhindura ubuzima!`,
      },
      data: { amount, currency, projectName, language },
    };
  }
}