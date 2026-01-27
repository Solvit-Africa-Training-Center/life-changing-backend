import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne 
} from 'typeorm';
import { Program } from './program.entity';
import { Staff } from '../../users/entities/staff.entity';

@Entity('impact_metrics')
export class ImpactMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Program, (program) => program.impactMetrics)
  program: Program;

  @Column()
  metricName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  metricValue: number;

  @Column()
  measurementUnit: string;

  @Column({
    type: 'enum',
    enum: ['weekly', 'monthly', 'quarterly', 'annual'],
  })
  period: string;

  @Column({ type: 'date' })
  periodDate: Date;

  @Column({
    type: 'enum',
    enum: ['kobo', 'manual', 'system_calculated'],
  })
  source: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Staff, { nullable: true })
  verifiedBy: Staff;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}