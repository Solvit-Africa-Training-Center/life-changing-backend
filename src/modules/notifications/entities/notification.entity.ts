import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  NotificationType,
  NotificationStatus,
  NotificationChannel,
} from '../../../config/constants';

@Entity('notifications')
export class Notif {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ type: 'jsonb' })
  title: {
    en: string;
    rw: string;
  };

  @Column({ type: 'jsonb' })
  message: {
    en: string;
    rw: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.IN_APP,
  })
  channel: NotificationChannel;

  @Column({ name: 'scheduled_for', type: 'timestamp', nullable: true })
  scheduledFor: Date;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ name: 'delivery_report', type: 'jsonb', nullable: true })
  deliveryReport: {
    providerId: string;
    status: string;
    errorMessage: string;
    cost: number;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
