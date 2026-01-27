import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { Language } from '../../../config/constants';

@Entity('ussd_sessions')
export class UssdSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phoneNumber: string;

  @Column()
  sessionId: string;

  @Column()
  menuState: string;

  @Column({ type: 'jsonb' })
  data: {
    currentMenu: string;
    previousMenu: string;
    selectedOptions: Record<string, any>;
    beneficiaryId?: string;
    language: Language;
    inputHistory: string[];
    trackingData?: {
      attendance?: string;
      incomeThisWeek?: number;
      challenges?: string;
      notes?: string;
    };
  };

  @Column({ type: 'int', default: 0 })
  stepCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastInteraction: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    network: string;
    device: string;
    location: string;
  };
}