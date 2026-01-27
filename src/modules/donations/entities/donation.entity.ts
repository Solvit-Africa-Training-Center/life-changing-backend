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
import { DonationType, PaymentMethod, PaymentStatus } from '../../../config/constants';

@Entity('donations')
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Donor, (donor) => donor.donations)
  donor: Donor;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  localAmount: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  exchangeRate: number;

  @Column({
    type: 'enum',
    enum: DonationType,
  })
  donationType: DonationType;

  @ManyToOne(() => Project, (project) => project.donations, { nullable: true })
  project: Project;

  @ManyToOne(() => Program, { nullable: true })
  program: Program;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ unique: true })
  transactionId: string;

  @Column({ type: 'jsonb', nullable: true })
  paymentDetails: {
    provider: string;
    accountNumber?: string;
    mobileNumber?: string;
    network?: string;
    cardLast4?: string;
    cardBrand?: string;
  };

  @Column({ default: false })
  receiptSent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  receiptSentAt: Date;

  @Column({ nullable: true })
  receiptNumber: string;

  @Column({ default: false })
  isAnonymous: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    ipAddress: string;
    userAgent: string;
    paymentGatewayResponse: any;
    taxReceiptEligible: boolean;
  };

  @Column({ type: 'text', nullable: true })
  donorMessage: string;

  @Column({ default: false })
  isTest: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}