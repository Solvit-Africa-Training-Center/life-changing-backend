import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
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
  @JoinColumn({ name: 'donor_id' })
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
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Program, { nullable: true })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @Column({
    type: 'enum',
    enum: RecurringStatus,
    default: RecurringStatus.ACTIVE,
  })
  status: RecurringStatus;

  @Column({ name: 'next_charge_date', type: 'date' })
  nextChargeDate: Date;

  @Column({ name: 'last_charged_date', type: 'date', nullable: true })
  lastChargedDate: Date;

  @Column({ name: 'last_charge_id', nullable: true })
  lastChargeId: string;

  @Column({ name: 'payment_method_id' })
  paymentMethodId: string;

  @Column({ name: 'subscription_id' })
  subscriptionId: string;

  @Column({ name: 'payment_method_details', type: 'jsonb' })
  paymentMethodDetails: {
    type: string;
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };

  @Column({ name: 'total_charges', type: 'int', default: 0 })
  totalCharges: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ name: 'send_reminders', default: false })
  sendReminders: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
