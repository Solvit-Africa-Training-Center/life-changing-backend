import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  OneToOne, 
  JoinColumn, 
  OneToMany 
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Donation } from './donation.entity';
import { RecurringDonation } from './recurring-donation.entity';
import { Currency, ReceiptPreference } from '../../../config/constants';

@Entity('donors')
export class Donor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.donor, { cascade: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  fullName: string;

  @Column()
  country: string;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.RWF,
  })
  preferredCurrency: Currency;

  @Column({ type: 'jsonb' })
  communicationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    frequency: 'instant' | 'daily' | 'weekly';
  };

  @Column({
    type: 'enum',
    enum: ReceiptPreference,
    default: ReceiptPreference.EMAIL,
  })
  receiptPreference: ReceiptPreference;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalDonated: number;

  @Column({ type: 'date', nullable: true })
  lastDonationDate: Date;

  @Column({ default: false })
  isRecurringDonor: boolean;

  @Column({ default: false })
  anonymityPreference: boolean;

  @Column({ type: 'jsonb', nullable: true })
  donorCategory: {
    type: 'individual' | 'corporate' | 'foundation';
    organizationName?: string;
    taxId?: string;
  };

  @Column({ default: true })
  receiveNewsletter: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Donation, (donation) => donation.donor)
  donations: Donation[];

  @OneToMany(() => RecurringDonation, (recurring) => recurring.donor)
  recurringDonations: RecurringDonation[];
}