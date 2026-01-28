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
  AttendanceStatus 
} from '../../../config/constants';

@Entity('ussd_sessions')
@Index(['sessionId'], { unique: true })
@Index(['phoneNumber'])
@Index(['isActive'])
export class UssdSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'phone_number', length: 20 })
  phoneNumber: string;

  @Column({ name: 'session_id', unique: true, length: 255 })
  sessionId: string;

  @Column({ 
    name: 'menu_state', 
    length: 100, 
    default: 'main_menu' 
  })
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

  @Column({ type: 'jsonb', nullable: true })
  data: {
    currentMenu: string;
    previousMenu: string;
    selectedOptions: Record<string, any>;
    beneficiaryId?: string;
    staffId?: string;
    donorId?: string;
    userId?: string;
    inputHistory: string[];
    
    // Weekly Tracking Data
    trackingData?: {
      attendance?: AttendanceStatus;
      incomeThisWeek?: number;
      expensesThisWeek?: number;
      currentCapital?: number;
      challenges?: string;
      solutionsImplemented?: string;
      notes?: string;
    };
    
    // Goal Data
    goalData?: {
      goalId?: string;
      goalType?: string;
      progressAmount?: number;
    };
    
    // Donation Data
    donationData?: {
      amount?: number;
      currency?: string;
      paymentMethod?: string;
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

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    network: string;
    device: string;
    location?: string;
    serviceCode: string;
  };
}