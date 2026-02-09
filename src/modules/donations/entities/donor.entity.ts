import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Donation } from './donation.entity';
import { RecurringDonation } from './recurring-donation.entity';
import { Currency, ReceiptPreference } from '../../../config/constants';

@Entity('donors')
export class Donor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { cascade: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  country: string;

  @Column({
    name: 'preferred_currency',
    type: 'enum',
    enum: Currency,
    default: Currency.RWF,
  })
  preferredCurrency: Currency;

  @Column({ name: 'communication_preferences', type: 'jsonb' })
  communicationPreferences: {
    email: boolean;
    sms: boolean;
  };

  @Column({
    name: 'receipt_preference',
    type: 'enum',
    enum: ReceiptPreference,
    default: ReceiptPreference.EMAIL,
  })
  receiptPreference: ReceiptPreference;

  @Column({ name: 'total_donated', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalDonated: number;

  @Column({ name: 'last_donation_date', type: 'date', nullable: true })
  lastDonationDate: Date;

  @Column({ name: 'is_recurring_donor', default: false })
  isRecurringDonor: boolean;

  @Column({ name: 'anonymity_preference', default: false })
  anonymityPreference: boolean;

  @Column({ name: 'receive_newsletter', default: true })
  receiveNewsletter: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Donation, (donation) => donation.donor)
  donations: Donation[];

  @OneToMany(() => RecurringDonation, (recurring) => recurring.donor)
  recurringDonations: RecurringDonation[];
}
