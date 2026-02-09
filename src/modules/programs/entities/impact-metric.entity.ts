import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Program } from './program.entity';
import { Staff } from '../../admin/entities/staff.entity';
import { MetricPeriod, MetricSource } from '../../../config/constants';

@Entity('impact_metrics')
export class ImpactMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Program, (program) => program.impactMetrics)
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @Column({ name: 'metric_name' })
  metricName: string;

  @Column({ name: 'metric_value', type: 'decimal', precision: 12, scale: 2 })
  metricValue: number;

  @Column({ name: 'measurement_unit' })
  measurementUnit: string;

  @Column({
    type: 'enum',
    enum: MetricPeriod,
  })
  period: MetricPeriod;

  @Column({ name: 'period_date', type: 'date' })
  periodDate: Date;

  @Column({
    type: 'enum',
    enum: MetricSource,
  })
  source: MetricSource;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifiedBy: Staff;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
