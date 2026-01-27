import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne 
} from 'typeorm';
import { Donor } from './donor.entity';
import { Project } from '../../programs/entities/project.entity';
import { Program } from '../../programs/entities/program.entity';
import { RecurringFrequency, RecurringStatus } from '../../../config/constants';

@Entity('recurring_donations')
export class RecurringDonation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Donor, (donor) => donor.recurringDonations)
  donor: Donor;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column({
    type: 'enum',
    enum: RecurringFrequency,
  })
  frequency: RecurringFrequency;

  @ManyToOne(() => Project, { nullable: true })
  project: Project;

  @ManyToOne(() => Program, { nullable: true })
  program: Program;

  @Column({
    type: 'enum',
    enum: RecurringStatus,
    default: RecurringStatus.ACTIVE,
  })
  status: RecurringStatus;

  @Column({ type: 'date' })
  nextChargeDate: Date;

  @Column({ type: 'date', nullable: true })
  lastChargedDate: Date;

  @Column({ nullable: true })
  lastChargeId: string;

  @Column()
  paymentMethodId: string;

  @Column()
  subscriptionId: string;

  @Column({ type: 'jsonb' })
  paymentMethodDetails: {
    type: string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };

  @Column({ type: 'int', default: 0 })
  totalCharges: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ default: false })
  sendReminders: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}