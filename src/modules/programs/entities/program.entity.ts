import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { Beneficiary } from '../../beneficiaries/entities/beneficiary.entity';
import { Project } from './project.entity';
import { ImpactMetric } from './impact-metric.entity';
import { Story } from '../../content/entities/story.entity';
import { Donation } from '../../donations/entities/donation.entity';
import { ProgramCategory, ProgramStatus } from '../../../config/constants';

@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({
    type: 'enum',
    enum: ProgramCategory,
  })
  category: ProgramCategory;

  @Column({ name: 'sdg_alignment', type: 'jsonb' })
  sdgAlignment: number[];

  @Column({ name: 'kpi_targets', type: 'jsonb' })
  kpiTargets: Record<string, any>;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate?: Date | null; 

  @Column({
    type: 'enum',
    enum: ProgramStatus,
    default: ProgramStatus.ACTIVE,
  })
  status: ProgramStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  budget: number;

  @Column({
    name: 'funds_allocated',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  fundsAllocated: number;

  @Column({
    name: 'funds_utilized',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  fundsUtilized: number;

  // ================= CLOUDINARY =================
  @Column({ name: 'cover_image', type: 'varchar', nullable: true })
  coverImage?: string;

  @Column({ name: 'cover_image_public_id', type: 'varchar',nullable: true })
  coverImagePublicId?: string;

  @Column({ type: 'varchar', nullable: true })
  logo?: string;

  @Column({ type: 'varchar', name: 'logo_public_id', nullable: true })
  logoPublicId?: string;

  // ================= META =================
  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ================= RELATIONS =================
  @OneToMany(() => Project, (project) => project.program, { cascade: true })
  projects: Project[];

  @OneToMany(() => Beneficiary, (beneficiary) => beneficiary.program)
  beneficiaries: Beneficiary[];

  @OneToMany(() => ImpactMetric, (metric) => metric.program)
  impactMetrics: ImpactMetric[];

  @OneToMany(() => Story, (story) => story.program)
  stories: Story[];

  @OneToMany(() => Donation, (donation) => donation.program)
  donations: Donation[];
}
