import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  OneToOne, 
  ManyToOne, 
  OneToMany, 
  JoinColumn 
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

  @OneToOne(() => User, (user) => user.beneficiary, { cascade: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  fullName: string;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column({ type: 'jsonb' })
  location: {
    district: string;
    sector: string;
    cell: string;
    village: string;
    gpsCoordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  @ManyToOne(() => Program, (program) => program.beneficiaries)
  program: Program;

  @Column({
    type: 'enum',
    enum: BeneficiaryStatus,
    default: BeneficiaryStatus.ACTIVE,
  })
  status: BeneficiaryStatus;

  @Column({ type: 'date' })
  enrollmentDate: Date;

  @Column({ type: 'date', nullable: true })
  exitDate: Date;

  @Column({ type: 'text', nullable: true })
  exitReason: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  startCapital: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  currentCapital: number;

  @Column()
  businessType: string;

  @Column({ type: 'jsonb', nullable: true })
  businessDetails: {
    product: string;
    market: string;
    suppliers: string[];
    challenges: string[];
  };

  @Column({
    type: 'enum',
    enum: TrackingFrequency,
    default: TrackingFrequency.WEEKLY,
  })
  trackingFrequency: TrackingFrequency;

  @Column({ type: 'date', nullable: true })
  lastTrackingDate: Date;

  @Column({ type: 'date', nullable: true })
  nextTrackingDate: Date;

  @Column({ nullable: true, select: false })
  ussdPin: string;

  @Column({ default: 0 })
  profileCompletion: number;

  @Column({ type: 'jsonb', nullable: true })
  profileData: {
    educationLevel: string;
    maritalStatus: string;
    numberOfChildren: number;
    skills: string[];
  };

  @Column({ default: false })
  requiresSpecialAttention: boolean;

  @Column({ type: 'text', nullable: true })
  specialNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
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

  get age(): number {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}