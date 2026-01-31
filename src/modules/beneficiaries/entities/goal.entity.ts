import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Beneficiary } from './beneficiary.entity';
import { GoalType, GoalStatus } from '../../../config/constants';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Beneficiary, (beneficiary) => beneficiary.goals)
  @JoinColumn({ name: 'beneficiary_id' })
  beneficiary: Beneficiary;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: GoalType,
  })
  type: GoalType;

  @Column({ name: 'target_amount', type: 'decimal', precision: 10, scale: 2 })
  targetAmount: number;

  @Column({ name: 'current_progress', type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentProgress: number;

  @Column({ name: 'target_date', type: 'date' })
  targetDate: Date;

  @Column({
    type: 'enum',
    enum: GoalStatus,
    default: GoalStatus.NOT_STARTED,
  })
  status: GoalStatus;

  @Column({ type: 'jsonb', nullable: true })
  milestones: Array<{
    description: string;
    targetAmount: number;
    targetDate: Date;
    completed: boolean;
    completedAt: Date;
  }>;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'action_plan', type: 'jsonb', nullable: true })
  actionPlan: {
    steps: string[];
    resourcesNeeded: string[];
    timeline: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'completed_at', type: 'date', nullable: true })
  completedAt: Date;
}
