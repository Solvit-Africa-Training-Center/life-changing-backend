import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne 
} from 'typeorm';
import { Beneficiary } from './beneficiary.entity';
import { Staff } from '../../users/entities/staff.entity';
import { AttendanceStatus, TaskStatus } from '../../../config/constants';

@Entity('weekly_trackings')
export class WeeklyTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Beneficiary, (beneficiary) => beneficiary.weeklyTrackings)
  beneficiary: Beneficiary;

  @Column({ type: 'date' })
  weekEnding: Date;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
  })
  attendance: AttendanceStatus;

  @Column({ nullable: true })
  taskGiven: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    nullable: true,
  })
  taskCompletionStatus: TaskStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  incomeThisWeek: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  expensesThisWeek: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentCapital: number;

  @Column({ type: 'jsonb', nullable: true })
  salesData: {
    unitsSold: number;
    averagePrice: number;
    bestSellingProduct: string;
  };

  @Column({ type: 'text', nullable: true })
  challenges: string;

  @Column({ type: 'text', nullable: true })
  solutionsImplemented: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  nextWeekPlan: {
    tasks: string[];
    goals: string[];
    supportNeeded: string[];
  };

  @ManyToOne(() => Staff, { nullable: true })
  submittedBy: Staff;

  @Column({ default: false })
  isOfflineSync: boolean;

  @Column({ nullable: true })
  syncSessionId: string;

  @Column({ type: 'jsonb', nullable: true })
  offlineData: {
    deviceInfo: string;
    location: {
      latitude: number;
      longitude: number;
    };
    timestamp: Date;
  };

  @CreateDateColumn()
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @ManyToOne(() => Staff, { nullable: true })
  verifiedBy: Staff;
}