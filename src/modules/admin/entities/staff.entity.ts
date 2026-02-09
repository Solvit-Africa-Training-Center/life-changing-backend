import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { WeeklyTracking } from '../../beneficiaries/entities/weekly-tracking.entity';
import { BeneficiaryDocument } from '../../beneficiaries/entities/beneficiary-document.entity';
import { ImpactMetric } from '../../programs/entities/impact-metric.entity';

@Entity('staff')
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { cascade: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'position', nullable: true })
  position: string; // e.g., "Project Manager", "Field Officer"

  @Column({ name: 'department', nullable: true })
  department: string; // e.g., "Operations", "Finance"

  @Column({ name: 'contact_info', type: 'jsonb', nullable: true })
  contactInfo: {
    emergencyContact: string;
    emergencyPhone: string;
    address: string;
  };

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
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
