import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  OneToMany 
} from 'typeorm';
import { Beneficiary } from '../../beneficiaries/entities/beneficiary.entity';
import { Project } from './project.entity';
import { ImpactMetric } from './impact-metric.entity';
import { Story } from '../../content/entities/story.entity';
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
    short: {
      en: string;
      rw: string;
    };
  };

  @Column({
    type: 'enum',
    enum: ProgramCategory,
  })
  category: ProgramCategory;

  @Column({ type: 'jsonb' })
  sdgAlignment: number[];

  @Column({ type: 'jsonb' })
  kpiTargets: Record<string, {
    target: number;
    unit: string;
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  }>;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ProgramStatus,
    default: ProgramStatus.ACTIVE,
  })
  status: ProgramStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  budget: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  fundsAllocated: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  fundsUtilized: number;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    partners: string[];
    locations: string[];
    targetDemographic: string;
    contactPerson?: string;
    contactPhone?: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Project, (project) => project.program)
  projects: Project[];

  @OneToMany(() => Beneficiary, (beneficiary) => beneficiary.program)
  beneficiaries: Beneficiary[];

  @OneToMany(() => ImpactMetric, (metric) => metric.program)
  impactMetrics: ImpactMetric[];

  @OneToMany(() => Story, (story) => story.program)
  stories: Story[];

  get budgetUtilizationPercentage(): number {
    return this.budget > 0 
      ? Math.round((this.fundsUtilized / this.budget) * 100) 
      : 0;
  }
}