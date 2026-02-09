import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Program } from '../../programs/entities/program.entity';
import { WeeklyTracking } from './weekly-tracking.entity';
import { Goal } from './goal.entity';
import { BeneficiaryDocument } from './beneficiary-document.entity';
import { EmergencyContact } from './emergency-contact.entity';
import { BeneficiaryStatus, TrackingFrequency } from '../../../config/constants';

@Entity('beneficiaries')
export class Beneficiary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { cascade: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: Date;

  @Column({ type: 'jsonb' })
  location: {
    district: string;
    sector: string;
    cell: string;
    village: string;
  };

  @ManyToOne(() => Program, (program) => program.beneficiaries, { nullable: true })
  @JoinColumn({ name: 'program_id' })
  program: Program | null;

  @Column({
    type: 'enum',
    enum: BeneficiaryStatus,
    default: BeneficiaryStatus.ACTIVE,
  })
  status: BeneficiaryStatus;

  @Column({ name: 'enrollment_date', type: 'date', nullable: true })
  enrollmentDate: Date | null;

  @Column({ name: 'exit_date', type: 'date', nullable: true })
  exitDate: Date | null;


  @Column({ name: 'start_capital', type: 'decimal', precision: 12, scale: 2 })
  startCapital: number;

  @Column({ name: 'current_capital', type: 'decimal', precision: 12, scale: 2, default: 0 })
  currentCapital: number;

  @Column({ name: 'business_type' })
  businessType: string;

  @Column({
    name: 'tracking_frequency',
    type: 'enum',
    enum: TrackingFrequency,
    default: TrackingFrequency.WEEKLY,
  })
  trackingFrequency: TrackingFrequency;

  @Column({ name: 'last_tracking_date', type: 'date', nullable: true })
  lastTrackingDate: Date | null;

  @Column({ name: 'next_tracking_date', type: 'date', nullable: true })
  nextTrackingDate: Date | null;

  @Column({ name: 'profile_completion', default: 0 })
  profileCompletion: number;

  @Column({ name: 'requires_special_attention', default: false })
  requiresSpecialAttention: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => WeeklyTracking, (tracking) => tracking.beneficiary)
  weeklyTrackings: WeeklyTracking[];

  @OneToMany(() => Goal, (goal) => goal.beneficiary)
  goals: Goal[];

  @OneToMany(() => BeneficiaryDocument, (document) => document.beneficiary)
  documents: BeneficiaryDocument[];

  @OneToMany(() => EmergencyContact, (contact) => contact.beneficiary)
  emergencyContacts: EmergencyContact[];
}
