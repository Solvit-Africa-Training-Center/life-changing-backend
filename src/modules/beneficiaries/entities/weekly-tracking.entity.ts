import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Beneficiary } from './beneficiary.entity';
import { Staff } from '../../admin/entities/staff.entity';
import { AttendanceStatus, TaskStatus, UserType } from '../../../config/constants';
import { User } from '../../users/entities/user.entity';

@Entity('weekly_trackings')
export class WeeklyTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Beneficiary, (beneficiary) => beneficiary.weeklyTrackings)
  @JoinColumn({ name: 'beneficiary_id' })
  beneficiary: Beneficiary;

  @Column({ name: 'week_ending', type: 'date' })
  weekEnding: Date;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
  })
  attendance: AttendanceStatus;

  @Column({ name: 'task_given', nullable: true })
  taskGiven: string;

  @Column({
    name: 'task_completion_status',
    type: 'enum',
    enum: TaskStatus,
    nullable: true,
  })
  taskCompletionStatus: TaskStatus;

  @Column({ name: 'income_this_week', type: 'decimal', precision: 10, scale: 2, default: 0 })
  incomeThisWeek: number;

  @Column({ name: 'expenses_this_week', type: 'decimal', precision: 10, scale: 2, default: 0 })
  expensesThisWeek: number;

  @Column({ name: 'current_capital', type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentCapital: number;

  @Column({ name: 'sales_data', type: 'jsonb', nullable: true })
  salesData: {
    unitsSold: number;
    averagePrice: number;
    bestSellingProduct: string;
  };

  @Column({ type: 'text', nullable: true })
  challenges: string;

  @Column({ name: 'solutions_implemented', type: 'text', nullable: true })
  solutionsImplemented: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'next_week_plan', type: 'jsonb', nullable: true })
  nextWeekPlan: {
    tasks: string[];
    goals: string[];
    supportNeeded: string[];
  };

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'submitted_by' })
  submittedBy: User;
  
  @Column({
    name: 'submitted_by_type',
    type: 'enum',
    enum: UserType,
  })
  submittedByType: UserType;

  @Column({ name: 'is_offline_sync', default: false })
  isOfflineSync: boolean;

  @Column({ name: 'sync_session_id', nullable: true })
  syncSessionId: string;

  @Column({ name: 'offline_data', type: 'jsonb', nullable: true })
  offlineData: {
    deviceInfo: string;
    location: {
      latitude: number;
      longitude: number;
    };
    timestamp: Date;
  };

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifiedBy: Staff;
}
