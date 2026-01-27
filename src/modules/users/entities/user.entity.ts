import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  OneToOne,
  OneToMany,
  BeforeInsert, 
  BeforeUpdate 
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { UserType, Language } from '../../../config/constants';
import { Beneficiary } from '../../beneficiaries/entities/beneficiary.entity';
import { Donor } from '../../donations/entities/donor.entity';
import { Staff } from './staff.entity';
import { ActivityLog } from '../../admin/entities/activity-log.entity';
import { Notification } from '../../notifications/entities/notification.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  @Column({ select: false })
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.BENEFICIARY,
  })
  userType: UserType;

  @Column({
    type: 'enum',
    enum: Language,
    default: Language.EN,
  })
  language: Language;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verificationToken: string;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  resetPasswordToken: string;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires: Date;

  @Column({ nullable: true })
  offlineSyncToken: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    language: Language;
  };

  // Relations
  @OneToOne(() => Beneficiary, (beneficiary) => beneficiary.user, { nullable: true })
  beneficiary: Beneficiary;

  @OneToOne(() => Donor, (donor) => donor.user, { nullable: true })
  donor: Donor;

  @OneToOne(() => Staff, (staff) => staff.user, { nullable: true })
  staff: Staff;

  @OneToMany(() => ActivityLog, (log) => log.user)
  activityLogs: ActivityLog[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const saltRounds = 10;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  async comparePassword(attempt: string): Promise<boolean> {
    return bcrypt.compare(attempt, this.password);
  }
}