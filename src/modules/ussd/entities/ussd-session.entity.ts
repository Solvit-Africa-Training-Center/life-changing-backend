// src/modules/ussd/entities/ussd-session.entity.ts
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index 
} from 'typeorm';
import { 
  UserType, 
  Language, 
  AttendanceStatus,
  BeneficiaryStatus,
  StaffRole,
  Currency,
  PaymentMethod,
  PaymentStatus,
  GoalStatus,
  GoalType,
  TaskStatus
} from '../../../config/constants';

@Entity('ussd_sessions')
@Index(['sessionId'], { unique: true })
@Index(['phoneNumber'])
@Index(['isActive'])
@Index(['userType'])
@Index(['language'])
export class UssdSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'phone_number', length: 20 })
  phoneNumber: string;

  @Column({ name: 'session_id', unique: true, length: 255 })
  sessionId: string;

  @Column({ name: 'menu_state', length: 100, default: 'main_menu' })
  menuState: string;

  @Column({ 
    name: 'user_type', 
    type: 'enum', 
    enum: UserType,
    nullable: true 
  })
  userType: UserType | null;

  @Column({ 
    name: 'language', 
    type: 'enum', 
    enum: Language,
    default: Language.EN 
  })
  language: Language;

  @Column({ type: 'jsonb', default: {} })
  data: {
    currentMenu: string;
    previousMenu: string | null;
    selectedOptions: Record<string, any>;
    beneficiaryId?: string;
    staffId?: string;
    donorId?: string;
    userId?: string;
    inputHistory: string[];
    trackingStep?: number;
    
    // Weekly Tracking Data
    trackingData?: {
      attendance?: AttendanceStatus;
      incomeThisWeek?: number;
      expensesThisWeek?: number;
      currentCapital?: number;
      challenges?: string;
      solutionsImplemented?: string;
      notes?: string;
      submissionDate?: Date;
    };
    
    // Goal Data
    goalData?: {
      goalId?: string;
      goalType?: GoalType;
      goalStatus?: GoalStatus;
      progressAmount?: number;
      targetAmount?: number;
      description?: string;
    };
    
    // Donation Data
    donationData?: {
      amount?: number;
      currency?: Currency;
      paymentMethod?: PaymentMethod;
      paymentStatus?: PaymentStatus;
      transactionId?: string;
      donorName?: string;
      donorPhone?: string;
    };
    
    // Staff Data
    staffData?: {
      role?: StaffRole;
      assignedTasks?: Array<{
        taskId: string;
        taskName: string;
        status: TaskStatus;
        dueDate?: Date;
      }>;
      beneficiariesToTrack?: string[];
    };
    
    // Emergency Data
    emergencyData?: {
      contactType?: 'call' | 'alert' | 'info';
      message?: string;
      sentTo?: string[];
    };
  };

  @Column({ name: 'step_count', type: 'int', default: 0 })
  stepCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'last_interaction' })
  lastInteraction: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    network: string;
    device: string;
    location?: string;
    serviceCode: string;
    networkCode?: string;
    sessionDuration?: number;
    errorCount?: number;
  };
}