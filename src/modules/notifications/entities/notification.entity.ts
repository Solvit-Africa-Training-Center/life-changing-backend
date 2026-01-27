import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne 
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Language } from '../../../config/constants';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @Column({
    type: 'enum',
    enum: [
      'donation_receipt',
      'tracking_reminder',
      'program_update',
      'impact_report',
      'system_alert',
      'welcome',
      'password_reset',
      'weekly_summary',
      'goal_achieved',
      'payment_failed'
    ],
  })
  type: string;

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
    enum: ['pending', 'sent', 'delivered', 'failed', 'read'],
    default: 'pending',
  })
  status: string;

  @Column({
    type: 'enum',
    enum: ['sms', 'email', 'in_app', 'push'],
    default: 'in_app',
  })
  channel: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  deliveryReport: {
    providerId: string;
    status: string;
    errorMessage: string;
    cost: number;
  };

  @CreateDateColumn()
  createdAt: Date;
}