import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Program } from './program.entity';
import { Donation } from '../../donations/entities/donation.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Program, (program) => program.projects)
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @Column({ type: 'jsonb' })
  name: {
    en: string;
    rw: string;
  };

  @Column({ type: 'jsonb' })
  description: {
    en: string;
    rw: string;
  };

  @Column({ name: 'budget_required', type: 'decimal', precision: 15, scale: 2 })
  budgetRequired: number;

  @Column({ name: 'budget_received', type: 'decimal', precision: 15, scale: 2, default: 0 })
  budgetReceived: number;

  @Column({ name: 'budget_utilized', type: 'decimal', precision: 15, scale: 2, default: 0 })
  budgetUtilized: number;

  @Column({ type: 'jsonb' })
  timeline: {
    start: Date;
    end: Date;
    milestones: any[];
  };

  @Column({ type: 'jsonb' })
  location: {
    districts: string[];
    sectors: string[];
  };

  @Column({ name: 'impact_metrics', type: 'jsonb' })
  impactMetrics: {
    beneficiariesTarget: number;
    beneficiariesReached: number;
    successIndicators: any[];
  };

  @Column({ name: 'donation_allocation_percentage', type: 'int', default: 100 })
  donationAllocationPercentage: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'cover_image', type: 'varchar', nullable: true })
  coverImage: string | null;

  @Column({ name: 'cover_image_public_id', type: 'varchar', nullable: true })
  coverImagePublicId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  gallery: Array<{
    url: string;
    publicId: string;
    caption: string;
    type: string;
    uploadedAt: Date;
  }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Donation, (donation) => donation.project)
  donations: Donation[];
}
