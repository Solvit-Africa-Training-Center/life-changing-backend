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
import { DonationType, PaymentMethod, PaymentStatus } from '../../../config/constants';

@Entity('donations')
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Donor, (donor) => donor.donations)
  @JoinColumn({ name: 'donor_id' })
  donor: Donor;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column({ name: 'local_amount', type: 'decimal', precision: 12, scale: 2 })
  localAmount: number;

  @Column({ name: 'exchange_rate', type: 'decimal', precision: 5, scale: 4 })
  exchangeRate: number;

  @Column({
    name: 'donation_type',
    type: 'enum',
    enum: DonationType,
  })
  donationType: DonationType;

  @ManyToOne(() => Project, (project) => project.donations, { nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Program, { nullable: true })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ name: 'transaction_id', unique: true })
  transactionId: string;

  @Column({ name: 'payment_details', type: 'jsonb', nullable: true })
  paymentDetails: {
    provider: string;
    accountNumber?: string;
    mobileNumber?: string;
    network?: string;
    cardLast4?: string;
    cardBrand?: string;
  };

  @Column({ name: 'receipt_sent', default: false })
  receiptSent: boolean;

  @Column({ name: 'receipt_sent_at', type: 'timestamp', nullable: true })
  receiptSentAt: Date;

  @Column({ name: 'receipt_number', nullable: true })
  receiptNumber: string;

  @Column({ name: 'is_anonymous', default: false })
  isAnonymous: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    ipAddress: string;
    userAgent: string;
    paymentGatewayResponse: any;
    taxReceiptEligible: boolean;
  };

  @Column({ name: 'donor_message', type: 'text', nullable: true })
  donorMessage: string;

  @Column({ name: 'is_test', default: false })
  isTest: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
