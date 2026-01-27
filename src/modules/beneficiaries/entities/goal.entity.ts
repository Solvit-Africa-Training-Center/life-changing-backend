import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne 
} from 'typeorm';
import { Beneficiary } from './beneficiary.entity';
import { GoalType, GoalStatus } from '../../../config/constants';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Beneficiary, (beneficiary) => beneficiary.goals)
  beneficiary: Beneficiary;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: GoalType,
  })
  type: GoalType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  targetAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentProgress: number;

  @Column({ type: 'date' })
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

  @Column({ type: 'jsonb', nullable: true })
  actionPlan: {
    steps: string[];
    resourcesNeeded: string[];
    timeline: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'date', nullable: true })
  completedAt: Date;

  get progressPercentage(): number {
    return this.targetAmount > 0 
      ? Math.round((this.currentProgress / this.targetAmount) * 100) 
      : 0;
  }
}