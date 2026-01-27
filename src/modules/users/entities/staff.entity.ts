import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  OneToOne, 
  JoinColumn, 
  OneToMany 
} from 'typeorm';
import { User } from './user.entity';
import { WeeklyTracking } from '../../beneficiaries/entities/weekly-tracking.entity';
import { BeneficiaryDocument } from '../../beneficiaries/entities/beneficiary-document.entity';
import { ImpactMetric } from '../../programs/entities/impact-metric.entity';
import { StaffRole } from '../../../config/constants';

@Entity('staff')
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { cascade: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  fullName: string;

  @Column({
    type: 'enum',
    enum: StaffRole,
    default: StaffRole.VIEWER,
  })
  role: StaffRole;

  @Column({ nullable: true })
  department: string;

  @Column({ type: 'jsonb' })
  permissions: string[];

  @Column({ nullable: true })
  employeeId: string;

  @Column({ type: 'date', nullable: true })
  hireDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  contactInfo: {
    emergencyContact: string;
    emergencyPhone: string;
    address: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => WeeklyTracking, (tracking) => tracking.submittedBy)
  submittedTrackings: WeeklyTracking[];

  @OneToMany(() => WeeklyTracking, (tracking) => tracking.verifiedBy)
  verifiedTrackings: WeeklyTracking[];

  @OneToMany(() => BeneficiaryDocument, (document) => document.uploadedBy)
  uploadedDocuments: BeneficiaryDocument[];

  @OneToMany(() => BeneficiaryDocument, (document) => document.verifiedBy)
  verifiedDocuments: BeneficiaryDocument[];

  @OneToMany(() => ImpactMetric, (metric) => metric.verifiedBy)
  verifiedMetrics: ImpactMetric[];
}