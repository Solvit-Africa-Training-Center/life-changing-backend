import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  OneToMany 
} from 'typeorm';
import { Program } from './program.entity';
import { Donation } from '../../donations/entities/donation.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Program, (program) => program.projects)
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
    objectives: {
      en: string[];
      rw: string[];
    };
  };

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  budgetRequired: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  budgetReceived: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  budgetUtilized: number;

  @Column({ type: 'jsonb' })
  timeline: {
    start: Date;
    end: Date;
    milestones: Array<{
      id: string;
      name: string;
      description: string;
      date: Date;
      status: 'pending' | 'completed' | 'delayed';
    }>;
  };

  @Column({ type: 'jsonb' })
  location: {
    districts: string[];
    sectors: string[];
    gpsBoundaries?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };

  @Column({ type: 'jsonb' })
  impactMetrics: {
    beneficiariesTarget: number;
    beneficiariesReached: number;
    successIndicators: Array<{
      name: string;
      target: number;
      current: number;
      unit: string;
    }>;
  };

  @Column({ type: 'int', default: 100 })
  donationAllocationPercentage: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ type: 'jsonb', nullable: true })
  gallery: Array<{
    url: string;
    caption: string;
    type: 'image' | 'video';
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Donation, (donation) => donation.project)
  donations: Donation[];

  get budgetProgressPercentage(): number {
    return this.budgetRequired > 0 
      ? Math.round((this.budgetReceived / this.budgetRequired) * 100) 
      : 0;
  }

  get timeRemainingPercentage(): number {
    if (!this.timeline.end) return 0;
    
    const now = new Date();
    const start = new Date(this.timeline.start);
    const end = new Date(this.timeline.end);
    
    if (now >= end) return 100;
    if (now <= start) return 0;
    
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    
    return Math.round((elapsed / totalDuration) * 100);
  }
}