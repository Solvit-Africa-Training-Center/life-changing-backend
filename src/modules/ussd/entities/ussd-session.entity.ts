import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  Index 
} from 'typeorm';
import { Language } from '../../../config/constants';

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

  @Column({ name: 'menu_state', length: 100, default: 'main_menu' })
  menuState: string;

  @Column({ type: 'jsonb' })
  data: {
    currentMenu: string;
    previousMenu: string;
    selectedOptions: Record<string, any>;
    beneficiaryId?: string;
    staffId?: string;
    donorId?: string;
    language: Language;
    inputHistory: string[];
    trackingData?: {
      attendance?: string;
      incomeThisWeek?: number;
      expensesThisWeek?: number;
      currentCapital?: number;
      challenges?: string;
      solutionsImplemented?: string;
      notes?: string;
    };
    goalData?: {
      goalId?: string;
      goalType?: string;
      progressAmount?: number;
    };
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