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
  GoalStatus,
  GoalType,
  TaskStatus
} from '../../../config/constants';
import { EmergencyContact } from '../../beneficiaries/entities/emergency-contact.entity';
import { Goal } from '../../beneficiaries/entities/goal.entity';

// Define interfaces for type safety
interface TrackingData {
  attendance?: AttendanceStatus;
  incomeThisWeek?: number;
  expensesThisWeek?: number;
  currentCapital?: number;
  challenges?: string;
  solutionsImplemented?: string;
  notes?: string;
  submissionDate?: Date;
}

interface GoalData {
  goalId?: string;
  goalType?: GoalType;
  goalStatus?: GoalStatus;
  progressAmount?: number;
  targetAmount?: number;
  description?: string;
  targetDate?: string;
}

// New interfaces for USSD flow
interface NewGoalData {
  type?: GoalType;
  description?: string;
  targetAmount?: number;
  targetDate?: string;
}

interface NewContactData {
  name?: string;
  phone?: string;
  relationship?: string;
  address?: string;
  isPrimary?: boolean;
}

interface DonationData {
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  transactionId?: string;
  donorName?: string;
  donorPhone?: string;
}

interface StaffData {
  role?: UserType;
  assignedTasks?: Array<{
    taskId: string;
    taskName: string;
    status: TaskStatus;
    dueDate?: Date;
  }>;
  beneficiariesToTrack?: string[];
}

interface EmergencyData {
  contactType?: 'call' | 'alert' | 'info';
  message?: string;
  sentTo?: string[];
}

interface SessionData {
  currentMenu: string;
  previousMenu: string | null;
  selectedOptions: Record<string, any>;
  inputHistory: string[];
  trackingStep?: number;
  
  // User identifiers
  beneficiaryId?: string;
  staffId?: string;
  donorId?: string;
  userId?: string;
  
  // Tracking data
  trackingData?: TrackingData | null;
  
  // Goal data
  goalData?: GoalData;
  newGoal?: NewGoalData | null;
  goalsList?: Goal[];
  selectedGoalIndex?: number;
  
  // Contact data
  newContact?: NewContactData | null;
  contactsList?: EmergencyContact[];
  
  // Donation data
  donationData?: DonationData;
  
  // Staff data
  staffData?: StaffData;
  
  // Emergency data
  emergencyData?: EmergencyData;
}

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
  data: SessionData;

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