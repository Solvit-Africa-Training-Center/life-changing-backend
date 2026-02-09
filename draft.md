# LCEO Nonprofit Platform - Backend Architecture

## **Project Overview**
A comprehensive backend system for Life-Changing Endeavor Organization (LCEO) supporting donor management, beneficiary tracking, program monitoring, and impact reporting with USSD/offline capabilities.

## **Tech Stack**

### **Core Backend**
- **Framework**: NestJS (Node.js with TypeScript)
- **Language**: TypeScript (strict mode enabled)
- **Package Manager**: npm or yarn

### **Database**
- **Primary**: PostgreSQL 15+ (relational data)
- **Secondary**: MongoDB (optional for logs/content)
- **Cache**: Redis 7+ (sessions, queues, caching)
- **ORM**: TypeORM with migrations

### **External Services**
- **Payments**: Stripe + Mobile Money APIs (MTN, Airtel Money)
- **SMS/USSD**: Africa's Talking API
- **Email**: SendGrid
- **File Storage**: Cloudinary
- **Data Collection**: Kobo Toolbox REST API
- **Monitoring**: Sentry (error tracking)

### **Development Tools**
- **Testing**: Jest, Supertest
- **Documentation**: Swagger/OpenAPI
- **CI/CD**: GitHub Actions
- **Containerization**: Docker & Docker Compose
- **Environment**: Node.js 18+

## **Project Structure**

```
lceo-backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── configuration.module.ts
│   │   ├── database.config.ts
│   │   ├── validation-schema.ts
│   │   └── constants/
│   ├── common/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── filters/
│   │   ├── middleware/
│   │   └── pipes/
│   ├── shared/
│   │   ├── database/
│   │   ├── services/
│   │   ├── utils/
│   │   └── interfaces/
│   └── modules/
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── strategies/
│       │   ├── dto/
│       │   └── interfaces/
│       ├── users/
│       ├── beneficiaries/
│       ├── donations/
│       ├── programs/
│       ├── content/
│       ├── ussd/
│       ├── analytics/
│       ├── admin/
│       ├── notifications/
│       └── webhooks/
├── test/
├── migrations/
├── scripts/
├── docker/
├── .env.example
├── .env
├── package.json
├── tsconfig.json
├── nest-cli.json
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## **Complete Database Schema with TypeORM**

### **Core Entities**

#### **1. User Entity**
```typescript
// src/modules/users/entities/user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true })
  phone: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.BENEFICIARY
  })
  userType: UserType;

  @Column({
    type: 'enum',
    enum: Language,
    default: Language.EN
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
  @OneToOne(() => Beneficiary, beneficiary => beneficiary.user, { nullable: true })
  beneficiary: Beneficiary;

  @OneToOne(() => Donor, donor => donor.user, { nullable: true })
  donor: Donor;

  @OneToOne(() => Staff, staff => staff.user, { nullable: true })
  staff: Staff;

  @OneToMany(() => ActivityLog, log => log.user)
  activityLogs: ActivityLog[];
}

export enum UserType {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  STAFF = 'staff',
  DONOR = 'donor',
  BENEFICIARY = 'beneficiary'
}

export enum Language {
  EN = 'en',
  RW = 'rw'
}
```

#### **2. Beneficiary Entity**
```typescript
// src/modules/beneficiaries/entities/beneficiary.entity.ts
@Entity('beneficiaries')
export class Beneficiary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, user => user.beneficiary)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  fullName: string;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column({ type: 'jsonb' })
  location: {
    district: string;
    sector: string;
    cell: string;
    village: string;
    gpsCoordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  @ManyToOne(() => Program, program => program.beneficiaries)
  program: Program;

  @Column({
    type: 'enum',
    enum: BeneficiaryStatus,
    default: BeneficiaryStatus.ACTIVE
  })
  status: BeneficiaryStatus;

  @Column({ type: 'date' })
  enrollmentDate: Date;

  @Column({ type: 'date', nullable: true })
  exitDate: Date;

  @Column({ type: 'text', nullable: true })
  exitReason: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  startCapital: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  currentCapital: number;

  @Column()
  businessType: string;

  @Column({ type: 'jsonb', nullable: true })
  businessDetails: {
    product: string;
    market: string;
    suppliers: string[];
    challenges: string[];
  };

  @Column({
    type: 'enum',
    enum: TrackingFrequency,
    default: TrackingFrequency.WEEKLY
  })
  trackingFrequency: TrackingFrequency;

  @Column({ type: 'date', nullable: true })
  lastTrackingDate: Date;

  @Column({ type: 'date', nullable: true })
  nextTrackingDate: Date;

  @Column({ nullable: true, select: false })
  ussdPin: string; // Hashed

  @Column({ default: 0 })
  profileCompletion: number;

  @Column({ type: 'jsonb', nullable: true })
  profileData: {
    educationLevel: string;
    maritalStatus: string;
    numberOfChildren: number;
    skills: string[];
  };

  @Column({ default: false })
  requiresSpecialAttention: boolean;

  @Column({ type: 'text', nullable: true })
  specialNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => WeeklyTracking, tracking => tracking.beneficiary)
  weeklyTrackings: WeeklyTracking[];

  @OneToMany(() => Goal, goal => goal.beneficiary)
  goals: Goal[];

  @OneToMany(() => BeneficiaryDocument, document => document.beneficiary)
  documents: BeneficiaryDocument[];

  @OneToMany(() => EmergencyContact, contact => contact.beneficiary)
  emergencyContacts: EmergencyContact[];
}

export enum BeneficiaryStatus {
  ACTIVE = 'active',
  GRADUATED = 'graduated',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export enum TrackingFrequency {
  WEEKLY = 'weekly',
  BI_WEEKLY = 'bi_weekly',
  MONTHLY = 'monthly'
}
```

#### **3. Donor Entity**
```typescript
// src/modules/donations/entities/donor.entity.ts
@Entity('donors')
export class Donor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, user => user.donor)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  fullName: string;

  @Column()
  country: string;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.RWF
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
    default: ReceiptPreference.EMAIL
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
  @OneToMany(() => Donation, donation => donation.donor)
  donations: Donation[];

  @OneToMany(() => RecurringDonation, recurring => recurring.donor)
  recurringDonations: RecurringDonation[];
}

export enum Currency {
  RWF = 'RWF',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP'
}

export enum ReceiptPreference {
  EMAIL = 'email',
  POSTAL = 'postal',
  NONE = 'none'
}
```

#### **4. Staff Entity**
```typescript
// src/modules/users/entities/staff.entity.ts
@Entity('staff')
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, user => user.staff)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  fullName: string;

  @Column({
    type: 'enum',
    enum: StaffRole,
    default: StaffRole.VIEWER
  })
  role: StaffRole;

  @Column({ nullable: true })
  department: string;

  @Column({ type: 'jsonb' })
  permissions: string[];

  @Column({ nullable: true })
  employeeId: string;

  @Column({ type: 'date', nullable: true })
  hireDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  contactInfo: {
    emergencyContact: string;
    emergencyPhone: string;
    address: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => WeeklyTracking, tracking => tracking.submittedBy)
  submittedTrackings: WeeklyTracking[];
}

export enum StaffRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  PROGRAM_MANAGER = 'program_manager',
  FIELD_OFFICER = 'field_officer',
  DATA_ENTRY = 'data_entry',
  VIEWER = 'viewer'
}
```

### **Program Management Entities**

#### **5. Program Entity**
```typescript
// src/modules/programs/entities/program.entity.ts
@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  name: {
    en: string;
    rw: string;
  };

  @Column({ type: 'jsonb' })
  description: {
    en: string;
    rw: string;
    short: {
      en: string;
      rw: string;
    };
  };

  @Column({
    type: 'enum',
    enum: ProgramCategory
  })
  category: ProgramCategory;

  @Column({ type: 'jsonb' })
  sdgAlignment: number[];

  @Column({ type: 'jsonb' })
  kpiTargets: Record<string, {
    target: number;
    unit: string;
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  }>;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ProgramStatus,
    default: ProgramStatus.ACTIVE
  })
  status: ProgramStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  budget: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  fundsAllocated: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  fundsUtilized: number;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    partners: string[];
    locations: string[];
    targetDemographic: string;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Project, project => project.program)
  projects: Project[];

  @OneToMany(() => Beneficiary, beneficiary => beneficiary.program)
  beneficiaries: Beneficiary[];

  @OneToMany(() => ImpactMetric, metric => metric.program)
  impactMetrics: ImpactMetric[];

  @OneToMany(() => Story, story => story.program)
  stories: Story[];
}

export enum ProgramCategory {
  EDUCATION = 'education',
  ENTREPRENEURSHIP = 'entrepreneurship',
  HEALTH = 'health',
  CROSS_CUTTING = 'cross_cutting',
  EMERGENCY_RESPONSE = 'emergency_response'
}

export enum ProgramStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived'
}
```

#### **6. Project Entity**
```typescript
// src/modules/programs/entities/project.entity.ts
@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Program, program => program.projects)
  program: Program;

  @Column({ type: 'jsonb' })
  name: {
    en: string;
    rw: string;
  };

  @Column({ type: 'jsonb' })
  description: {
    en: string;
    rw: string;
    objectives: {
      en: string[];
      rw: string[];
    };
  };

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  budgetRequired: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  budgetReceived: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  budgetUtilized: number;

  @Column({ type: 'jsonb' })
  timeline: {
    start: Date;
    end: Date;
    milestones: Array<{
      id: string;
      name: string;
      description: string;
      date: Date;
      status: 'pending' | 'completed' | 'delayed';
    }>;
  };

  @Column({ type: 'jsonb' })
  location: {
    districts: string[];
    sectors: string[];
    gpsBoundaries?: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
  };

  @Column({ type: 'jsonb' })
  impactMetrics: {
    beneficiariesTarget: number;
    beneficiariesReached: number;
    successIndicators: Array<{
      name: string;
      target: number;
      current: number;
      unit: string;
    }>;
  };

  @Column({ type: 'int', default: 100 })
  donationAllocationPercentage: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ type: 'jsonb', nullable: true })
  gallery: Array<{
    url: string;
    caption: string;
    type: 'image' | 'video';
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Donation, donation => donation.project)
  donations: Donation[];
}
```

### **Donation System Entities**

#### **7. Donation Entity**
```typescript
// src/modules/donations/entities/donation.entity.ts
@Entity('donations')
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Donor, donor => donor.donations)
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
    enum: DonationType
  })
  donationType: DonationType;

  @ManyToOne(() => Project, project => project.donations, { nullable: true })
  project: Project;

  @ManyToOne(() => Program, { nullable: true })
  program: Program;

  @Column({
    type: 'enum',
    enum: PaymentMethod
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
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

export enum DonationType {
  ONE_TIME = 'one_time',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export enum PaymentMethod {
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled'
}
```

#### **8. Recurring Donation Entity**
```typescript
// src/modules/donations/entities/recurring-donation.entity.ts
@Entity('recurring_donations')
export class RecurringDonation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Donor, donor => donor.recurringDonations)
  donor: Donor;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column({
    type: 'enum',
    enum: RecurringFrequency
  })
  frequency: RecurringFrequency;

  @ManyToOne(() => Project, { nullable: true })
  project: Project;

  @ManyToOne(() => Program, { nullable: true })
  program: Program;

  @Column({
    type: 'enum',
    enum: RecurringStatus,
    default: RecurringStatus.ACTIVE
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

export enum RecurringFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export enum RecurringStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}
```

### **Tracking & Impact Entities**

#### **9. Weekly Tracking Entity**
```typescript
// src/modules/beneficiaries/entities/weekly-tracking.entity.ts
@Entity('weekly_trackings')
export class WeeklyTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Beneficiary, beneficiary => beneficiary.weeklyTrackings)
  beneficiary: Beneficiary;

  @Column({ type: 'date' })
  weekEnding: Date;

  @Column({
    type: 'enum',
    enum: AttendanceStatus
  })
  attendance: AttendanceStatus;

  @Column({ nullable: true })
  taskGiven: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    nullable: true
  })
  taskCompletionStatus: TaskStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  incomeThisWeek: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  expensesThisWeek: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentCapital: number;

  @Column({ type: 'jsonb', nullable: true })
  salesData: {
    unitsSold: number;
    averagePrice: number;
    bestSellingProduct: string;
  };

  @Column({ type: 'text', nullable: true })
  challenges: string;

  @Column({ type: 'text', nullable: true })
  solutionsImplemented: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  nextWeekPlan: {
    tasks: string[];
    goals: string[];
    supportNeeded: string[];
  };

  @ManyToOne(() => Staff)
  submittedBy: Staff;

  @Column({ default: false })
  isOfflineSync: boolean;

  @Column({ nullable: true })
  syncSessionId: string;

  @Column({ type: 'jsonb', nullable: true })
  offlineData: {
    deviceInfo: string;
    location: {
      latitude: number;
      longitude: number;
    };
    timestamp: Date;
  };

  @CreateDateColumn()
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @ManyToOne(() => Staff, { nullable: true })
  verifiedBy: Staff;
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused'
}

export enum TaskStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
  NOT_DONE = 'not_done',
  PARTIALLY_DONE = 'partially_done'
}
```

#### **10. Goal Entity**
```typescript
// src/modules/beneficiaries/entities/goal.entity.ts
@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Beneficiary, beneficiary => beneficiary.goals)
  beneficiary: Beneficiary;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: GoalType
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
    default: GoalStatus.NOT_STARTED
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
}

export enum GoalType {
  FINANCIAL = 'financial',
  BUSINESS = 'business',
  EDUCATION = 'education',
  PERSONAL = 'personal',
  SKILLS = 'skills'
}

export enum GoalStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  ACHIEVED = 'achieved',
  ABANDONED = 'abandoned',
  ON_HOLD = 'on_hold'
}
```

### **USSD & Communication Entities**

#### **11. USSD Session Entity**
```typescript
// src/modules/ussd/entities/ussd-session.entity.ts
@Entity('ussd_sessions')
export class UssdSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phoneNumber: string;

  @Column()
  sessionId: string;

  @Column()
  menuState: string;

  @Column({ type: 'jsonb' })
  data: {
    currentMenu: string;
    previousMenu: string;
    selectedOptions: Record<string, any>;
    beneficiaryId?: string;
    language: Language;
    inputHistory: string[];
    trackingData?: Partial<WeeklyTracking>;
  };

  @Column({ type: 'int', default: 0 })
  stepCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastInteraction: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    network: string;
    device: string;
    location: string;
  };
}
```

#### **12. SMS/Notification Entity**
```typescript
// src/modules/notifications/entities/notification.entity.ts
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @Column()
  type: NotificationType;

  @Column({ type: 'jsonb' })
  title: {
    en: string;
    rw: string;
  };

  @Column({ type: 'jsonb' })
  message: {
    en: string;
    rw: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING
  })
  status: NotificationStatus;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.IN_APP
  })
  channel: NotificationChannel;

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  deliveryReport: {
    providerId: string;
    status: string;
    errorMessage: string;
    cost: number;
  };

  @CreateDateColumn()
  createdAt: Date;
}

export enum NotificationType {
  DONATION_RECEIPT = 'donation_receipt',
  TRACKING_REMINDER = 'tracking_reminder',
  PROGRAM_UPDATE = 'program_update',
  IMPACT_REPORT = 'impact_report',
  SYSTEM_ALERT = 'system_alert',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read'
}

export enum NotificationChannel {
  SMS = 'sms',
  EMAIL = 'email',
  IN_APP = 'in_app',
  PUSH = 'push'
}
```

### **Content Management Entities**

#### **13. Story/Testimonial Entity**
```typescript
// src/modules/content/entities/story.entity.ts
@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  title: {
    en: string;
    rw: string;
  };

  @Column({ type: 'jsonb' })
  content: {
    en: string;
    rw: string;
  };

  @Column()
  authorName: string;

  @Column({
    type: 'enum',
    enum: AuthorRole
  })
  authorRole: AuthorRole;

  @Column({ nullable: true })
  authorPhoto: string;

  @ManyToOne(() => Program, { nullable: true })
  program: Program;

  @Column({ nullable: true })
  beneficiaryId: string;

  @Column({ type: 'jsonb', nullable: true })
  media: Array<{
    url: string;
    type: 'image' | 'video';
    caption: string;
    thumbnail: string;
  }>;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: true })
  isPublished: boolean;

  @Column({ type: 'date' })
  publishedDate: Date;

  @Column({
    type: 'enum',
    enum: Language,
    default: Language.BOTH
  })
  language: Language;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  shareCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    tags: string[];
    location: string;
    duration: number; // reading time in minutes
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export enum AuthorRole {
  BENEFICIARY = 'beneficiary',
  DONOR = 'donor',
  STAFF = 'staff',
  PARTNER = 'partner',
  VOLUNTEER = 'volunteer'
}
```

### **System Entities**

#### **14. Activity Log Entity**
```typescript
// src/modules/admin/entities/activity-log.entity.ts
@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @Column()
  action: string;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, {
    old: any;
    new: any;
  }>;

  @Column()
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ type: 'jsonb', nullable: true })
  location: {
    country: string;
    region: string;
    city: string;
  };

  @CreateDateColumn()
  createdAt: Date;
}
```

## **NestJS Module Implementation**

### **Auth Module**
```typescript
// src/modules/auth/auth.module.ts
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '24h'),
        },
      }),
      inject: [ConfigService],
    }),
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    RefreshTokenStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
```

### **USSD Module**
```typescript
// src/modules/ussd/ussd.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([UssdSession]),
    BeneficiariesModule,
    HttpModule,
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'ussd',
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
  controllers: [UssdController],
  providers: [
    UssdService,
    AfricaTalkingService,
    UssdMenuProvider,
    {
      provide: 'USSD_PROCESSORS',
      useFactory: (...processors: UssdProcessor[]) => processors,
      inject: [
        BeneficiaryProgressProcessor,
        WeeklyReportProcessor,
        ContactProcessor,
        ProgramInfoProcessor,
      ],
    },
  ],
  exports: [UssdService],
})
export class UssdModule {}
```

## **Configuration Module**

```typescript
// src/config/configuration.ts
export default () => ({
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'lceo',
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-super-secret-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // Payment Gateways
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  
  mobileMoney: {
    mtn: {
      apiKey: process.env.MTN_MOMO_API_KEY,
      userId: process.env.MTN_MOMO_USER_ID,
      primaryKey: process.env.MTN_MOMO_PRIMARY_KEY,
    },
    airtel: {
      apiKey: process.env.AIRTEL_MONEY_API_KEY,
      clientId: process.env.AIRTEL_MONEY_CLIENT_ID,
      clientSecret: process.env.AIRTEL_MONEY_CLIENT_SECRET,
    },
  },
  
  // Africa's Talking
  africasTalking: {
    apiKey: process.env.AFRICAS_TALKING_API_KEY,
    username: process.env.AFRICAS_TALKING_USERNAME,
    shortCode: process.env.AFRICAS_TALKING_SHORT_CODE,
  },
  
  // SendGrid
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.EMAIL_FROM || 'noreply@lceo.org',
    fromName: process.env.EMAIL_FROM_NAME || 'LCEO',
  },
  
  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  
  // Kobo Toolbox
  kobo: {
    token: process.env.KOBO_TOOLBOX_TOKEN,
    baseUrl: process.env.KOBO_BASE_URL || 'https://kf.kobotoolbox.org',
    formIds: process.env.KOBO_FORM_IDS?.split(',') || [],
  },
  
  // Security
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
    rateLimit: {
      ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
      limit: parseInt(process.env.RATE_LIMIT || '100', 10),
    },
  },
  
  // Features
  features: {
    enableUSSD: process.env.ENABLE_USSD !== 'false',
    enableOfflineSync: process.env.ENABLE_OFFLINE_SYNC !== 'false',
    enableKoboSync: process.env.ENABLE_KOBO_SYNC !== 'false',
    enablePayment: process.env.ENABLE_PAYMENT !== 'false',
  },
});
```

## **Environment Variables**

Create `.env` file:

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# ============================================
# DATABASE
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=lceo
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lceo

# ============================================
# REDIS
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ============================================
# AUTHENTICATION & SECURITY
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10

# ============================================
# PAYMENT GATEWAYS
# ============================================
# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Mobile Money - MTN Rwanda
MTN_MOMO_API_KEY=xxx
MTN_MOMO_USER_ID=xxx
MTN_MOMO_PRIMARY_KEY=xxx

# Mobile Money - Airtel Money Rwanda
AIRTEL_MONEY_API_KEY=xxx
AIRTEL_MONEY_CLIENT_ID=xxx
AIRTEL_MONEY_CLIENT_SECRET=xxx

# ============================================
# COMMUNICATION SERVICES
# ============================================
# Africa's Talking (SMS/USSD)
AFRICAS_TALKING_API_KEY=xxx
AFRICAS_TALKING_USERNAME=xxx
AFRICAS_TALKING_SHORT_CODE=xxx

# SendGrid (Email)
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM=noreply@lceo.org
EMAIL_FROM_NAME=LCEO

# ============================================
# FILE STORAGE
# ============================================
# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# ============================================
# EXTERNAL INTEGRATIONS
# ============================================
# Kobo Toolbox
KOBO_TOOLBOX_TOKEN=xxx
KOBO_BASE_URL=https://kf.kobotoolbox.org
KOBO_FORM_IDS=form1_id,form2_id

# ============================================
# FEATURE TOGGLES
# ============================================
ENABLE_USSD=true
ENABLE_OFFLINE_SYNC=true
ENABLE_KOBO_SYNC=true
ENABLE_PAYMENT=true

# ============================================
# MONITORING
# ============================================
SENTRY_DSN=xxx

# ============================================
# CORS
# ============================================
CORS_ORIGIN=http://localhost:3001
```

## **API Endpoints Documentation**

### **Authentication**
```
POST   /auth/register               # Register new user
POST   /auth/login                  # Login
POST   /auth/logout                 # Logout
POST   /auth/refresh-token          # Refresh JWT token
POST   /auth/forgot-password        # Request password reset
POST   /auth/reset-password         # Reset password
POST   /auth/verify-phone           # Verify phone number
POST   /auth/verify-email           # Verify email
```

### **Users**
```
GET    /users/profile               # Get current user profile
PUT    /users/profile               # Update profile
GET    /users/beneficiaries         # Get beneficiaries (admin)
GET    /users/donors                # Get donors (admin)
GET    /users/staff                 # Get staff (admin)
PUT    /users/:id/role              # Update user role (admin)
PUT    /users/:id/status            # Update user status (admin)
```

### **Beneficiaries**
```
GET    /beneficiaries               # List beneficiaries
GET    /beneficiaries/:id           # Get beneficiary details
POST   /beneficiaries               # Create beneficiary (admin)
PUT    /beneficiaries/:id           # Update beneficiary
DELETE /beneficiaries/:id           # Delete beneficiary (admin)
GET    /beneficiaries/:id/progress  # Get beneficiary progress
GET    /beneficiaries/:id/trackings # Get tracking history
POST   /beneficiaries/:id/trackings # Submit weekly tracking
GET    /beneficiaries/:id/goals     # Get goals
POST   /beneficiaries/:id/goals     # Create goal
PUT    /beneficiaries/:id/goals/:goalId  # Update goal
```

### **Programs & Projects**
```
GET    /programs                    # List all programs
GET    /programs/:id                # Get program details
POST   /programs                    # Create program (admin)
PUT    /programs/:id                # Update program (admin)
DELETE /programs/:id                # Delete program (admin)
GET    /programs/:id/projects       # Get program projects
GET    /programs/:id/beneficiaries  # Get program beneficiaries
GET    /programs/:id/impact         # Get program impact metrics

GET    /projects                    # List all projects
GET    /projects/:id                # Get project details
POST   /projects                    # Create project (admin)
PUT    /projects/:id                # Update project (admin)
GET    /projects/:id/donations      # Get project donations
```

### **Donations**
```
GET    /donations                   # List donations (admin/donor)
POST   /donations                   # Create donation
GET    /donations/:id               # Get donation details
POST   /donations/:id/cancel        # Cancel donation
GET    /donations/recurring         # List recurring donations
POST   /donations/recurring         # Create recurring donation
PUT    /donations/recurring/:id     # Update recurring donation
DELETE /donations/recurring/:id     # Cancel recurring donation
POST   /donations/webhook/stripe    # Stripe webhook
POST   /donations/webhook/momo      # Mobile money webhook
```

### **USSD API**
```
POST   /ussd                        # USSD endpoint (Africa's Talking)
GET    /ussd/sessions               # List USSD sessions (admin)
GET    /ussd/sessions/:id           # Get USSD session details
POST   /ussd/offline-sync           # Sync offline data
GET    /ussd/menu/:phone            # Get current menu state
```

### **Content Management**
```
GET    /content/pages               # List pages
GET    /content/pages/:slug         # Get page by slug
POST   /content/pages               # Create page (admin)
PUT    /content/pages/:id           # Update page (admin)
DELETE /content/pages/:id           # Delete page (admin)

GET    /content/stories             # List stories
GET    /content/stories/:id         # Get story details
POST   /content/stories             # Create story (admin)
PUT    /content/stories/:id         # Update story (admin)

GET    /content/resources           # List resources
POST   /content/resources           # Upload resource (admin)
DELETE /content/resources/:id       # Delete resource (admin)
```

### **Admin Dashboard**
```
GET    /admin/dashboard/stats       # Dashboard statistics
GET    /admin/dashboard/analytics   # Advanced analytics
GET    /admin/reports/donations     # Generate donation report
GET    /admin/reports/beneficiaries # Generate beneficiary report
GET    /admin/reports/programs      # Generate program report
POST   /admin/import/beneficiaries  # Import beneficiaries from Excel
POST   /admin/import/donations      # Import donations from CSV
POST   /admin/sync/kobo             # Sync with Kobo Toolbox
GET    /admin/activity-logs         # View activity logs
GET    /admin/system-health         # System health check
```

## **USSD Flow Implementation**

### **USSD Menu Structure**
```typescript
export const USSD_MENUS = {
  WELCOME: {
    text: 'Welcome to LCEO\n1. English\n2. Kinyarwanda',
    next: {
      '1': 'MAIN_EN',
      '2': 'MAIN_RW'
    }
  },
  
  MAIN_EN: {
    text: 'Main Menu\n1. My Progress\n2. Submit Report\n3. Contact Supervisor\n4. Emergency\n5. Program Info\n0. Exit',
    next: {
      '1': 'PROGRESS_EN',
      '2': 'REPORT_START_EN',
      '3': 'CONTACT_EN',
      '4': 'EMERGENCY_EN',
      '5': 'PROGRAM_INFO_EN',
      '0': 'EXIT'
    }
  },
  
  MAIN_RW: {
    text: 'Menu Nyamukuru\n1. Ibikorwa byanjye\n2. Tanga raporo\n3. Vugana n\'umusuzi\n4. Emergency\n5. Amakuru ku gahato\n0. Gusohoka',
    next: {
      '1': 'PROGRESS_RW',
      '2': 'REPORT_START_RW',
      '3': 'CONTACT_RW',
      '4': 'EMERGENCY_RW',
      '5': 'PROGRAM_INFO_RW',
      '0': 'EXIT'
    }
  },
  
  PROGRESS_EN: {
    processor: 'beneficiaryProgress',
    next: {
      '1': 'MAIN_EN',
      '2': 'EXIT'
    }
  },
  
  REPORT_START_EN: {
    text: 'Weekly Report\n1. Start Report\n0. Back',
    next: {
      '1': 'REPORT_ATTENDANCE_EN',
      '0': 'MAIN_EN'
    }
  },
  
  REPORT_ATTENDANCE_EN: {
    text: 'Attendance this week?\n1. Present\n2. Absent\n3. Late',
    next: {
      '1': 'REPORT_INCOME_EN',
      '2': 'REPORT_INCOME_EN',
      '3': 'REPORT_INCOME_EN'
    }
  },
  
  REPORT_INCOME_EN: {
    text: 'Income this week? (RWF)\nEnter amount:',
    processor: 'validateNumber',
    next: 'REPORT_CHALLENGES_EN'
  },
  
  REPORT_CHALLENGES_EN: {
    text: 'Any challenges?\n1. Yes\n2. No',
    next: {
      '1': 'REPORT_CHALLENGES_DETAIL_EN',
      '2': 'REPORT_CONFIRM_EN'
    }
  },
  
  REPORT_CONFIRM_EN: {
    processor: 'submitWeeklyReport',
    next: 'MAIN_EN'
  }
};
```

### **USSD Service Implementation**
```typescript
@Injectable()
export class UssdService {
  constructor(
    @InjectRepository(UssdSession)
    private ussdSessionRepository: Repository<UssdSession>,
    private beneficiariesService: BeneficiariesService,
    private weeklyTrackingService: WeeklyTrackingService,
    private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  async processUssdRequest(
    phoneNumber: string,
    sessionId: string,
    text: string,
    networkCode: string,
  ): Promise<string> {
    // Get or create session
    let session = await this.getSession(sessionId);
    
    if (!session) {
      session = await this.createSession(phoneNumber, sessionId, networkCode);
      return this.getMenuText('WELCOME', session);
    }

    // Update session last interaction
    session.lastInteraction = new Date();
    session.stepCount += 1;

    // Parse user input
    const input = text ? text.split('*').pop() : '';
    const currentMenu = session.data.currentMenu || 'WELCOME';

    // Get menu configuration
    const menu = USSD_MENUS[currentMenu];

    if (!menu) {
      return 'END Invalid menu state. Please try again.';
    }

    // Process input
    if (menu.processor) {
      const result = await this.processMenu(
        menu.processor,
        session,
        input,
        currentMenu,
      );
      
      if (result) {
        return result;
      }
    }

    // Determine next menu
    const nextMenuKey = menu.next?.[input] || menu.next?.default;
    
    if (!nextMenuKey) {
      return 'END Invalid selection. Please try again.';
    }

    if (nextMenuKey === 'EXIT') {
      await this.endSession(sessionId);
      return 'END Thank you for using LCEO USSD service.';
    }

    // Update session data
    session.data = {
      ...session.data,
      currentMenu: nextMenuKey,
      previousMenu: currentMenu,
      selectedOptions: {
        ...session.data.selectedOptions,
        [currentMenu]: input,
      },
      inputHistory: [...(session.data.inputHistory || []), input],
    };

    await this.ussdSessionRepository.save(session);

    // Return next menu
    return this.getMenuText(nextMenuKey, session);
  }

  private async processMenu(
    processorName: string,
    session: UssdSession,
    input: string,
    currentMenu: string,
  ): Promise<string | null> {
    switch (processorName) {
      case 'beneficiaryProgress':
        return await this.handleBeneficiaryProgress(session);
        
      case 'submitWeeklyReport':
        return await this.handleWeeklyReportSubmission(session);
        
      case 'validateNumber':
        const number = parseInt(input, 10);
        if (isNaN(number) || number < 0) {
          return 'END Invalid amount. Please enter a valid number.';
        }
        session.data.trackingData = {
          ...session.data.trackingData,
          incomeThisWeek: number,
        };
        await this.ussdSessionRepository.save(session);
        return null;
        
      default:
        return null;
    }
  }

  private async handleBeneficiaryProgress(
    session: UssdSession,
  ): Promise<string> {
    const beneficiary = await this.beneficiariesService.findByPhone(
      session.phoneNumber,
    );

    if (!beneficiary) {
      return 'END You are not registered as a beneficiary.';
    }

    const latestTracking = await this.weeklyTrackingService.getLatest(
      beneficiary.id,
    );

    const language = session.data.language || Language.EN;
    
    if (language === Language.EN) {
      return `CON Your Progress:
Capital: ${beneficiary.currentCapital} RWF
Last Week Income: ${latestTracking?.incomeThisWeek || 0} RWF
Current Goal: ${beneficiary.goals?.[0]?.targetAmount || 0} RWF

1. Back
2. Main Menu`;
    } else {
      return `CON Ibikorwa byanjye:
Capital: ${beneficiary.currentCapital} RWF
Amafaranga yatsindiye muri iki cyumweru: ${latestTracking?.incomeThisWeek || 0} RWF
Icyo nitegereje: ${beneficiary.goals?.[0]?.targetAmount || 0} RWF

1. Subira inyuma
2. Menu Nyamukuru`;
    }
  }

  private async handleWeeklyReportSubmission(
    session: UssdSession,
  ): Promise<string> {
    const beneficiary = await this.beneficiariesService.findByPhone(
      session.phoneNumber,
    );

    if (!beneficiary) {
      return 'END You are not registered as a beneficiary.';
    }

    const trackingData = session.data.trackingData;
    
    if (!trackingData) {
      return 'END Report data missing. Please start again.';
    }

    // Create weekly tracking
    const weeklyTracking = new WeeklyTracking();
    weeklyTracking.beneficiary = beneficiary;
    weeklyTracking.weekEnding = new Date();
    weeklyTracking.attendance = trackingData.attendance || AttendanceStatus.PRESENT;
    weeklyTracking.incomeThisWeek = trackingData.incomeThisWeek || 0;
    weeklyTracking.challenges = trackingData.challenges;
    weeklyTracking.isOfflineSync = true;
    weeklyTracking.syncSessionId = session.sessionId;
    
    await this.weeklyTrackingService.create(weeklyTracking);

    // Update beneficiary capital
    beneficiary.currentCapital += trackingData.incomeThisWeek || 0;
    beneficiary.lastTrackingDate = new Date();
    await this.beneficiariesService.update(beneficiary.id, beneficiary);

    const language = session.data.language || Language.EN;
    
    if (language === Language.EN) {
      return 'END Thank you! Your weekly report has been submitted successfully.';
    } else {
      return 'END Murakoze! Raporo yanyu y\'iki cyumweru yatanzwe neza.';
    }
  }
}
```

## **Offline Sync Implementation**

```typescript
@Injectable()
export class OfflineSyncService {
  constructor(
    private beneficiariesService: BeneficiariesService,
    private weeklyTrackingService: WeeklyTrackingService,
    private cacheManager: Cache,
    private configService: ConfigService,
  ) {}

  async syncOfflineData(
    userId: string,
    syncData: OfflineSyncDto,
  ): Promise<SyncResponseDto> {
    const pendingActions = await this.cacheManager.get<OfflineAction[]>(
      `offline:${userId}`,
    );

    const results: SyncResult[] = [];
    let successfulSyncs = 0;
    let failedSyncs = 0;

    // Process pending actions
    if (pendingActions && pendingActions.length > 0) {
      for (const action of pendingActions) {
        try {
          switch (action.type) {
            case 'tracking':
              await this.syncWeeklyTracking(action.data, userId);
              break;
              
            case 'profile_update':
              await this.syncProfileUpdate(action.data, userId);
              break;
              
            case 'goal_update':
              await this.syncGoalUpdate(action.data, userId);
              break;
          }
          
          results.push({
            type: action.type,
            status: 'success',
            timestamp: action.timestamp,
          });
          successfulSyncs++;
        } catch (error) {
          results.push({
            type: action.type,
            status: 'failed',
            error: error.message,
            timestamp: action.timestamp,
          });
          failedSyncs++;
        }
      }
      
      // Clear processed actions
      await this.cacheManager.del(`offline:${userId}`);
    }

    // Process current sync data
    if (syncData.trackings && syncData.trackings.length > 0) {
      for (const tracking of syncData.trackings) {
        try {
          await this.syncWeeklyTracking(tracking, userId);
          successfulSyncs++;
        } catch (error) {
          failedSyncs++;
        }
      }
    }

    // Get fresh data for client
    const freshData = await this.getDataForOfflineUse(userId);

    return {
      success: true,
      successfulSyncs,
      failedSyncs,
      results,
      data: freshData,
      lastSync: new Date(),
    };
  }

  async getDataForOfflineUse(userId: string): Promise<OfflineDataDto> {
    const beneficiary = await this.beneficiariesService.findOne(userId);
    
    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    // Get essential data for offline use
    const program = beneficiary.program;
    const recentTrackings = await this.weeklyTrackingService.findRecent(
      beneficiary.id,
      4,
    );
    const goals = beneficiary.goals;
    const emergencyContacts = await this.getEmergencyContacts();

    // Get FAQs based on language
    const faqs = await this.getFAQs(beneficiary.user.language);

    // Get program information
    const programInfo = {
      name: program.name[beneficiary.user.language],
      description: program.description[beneficiary.user.language],
      contactPerson: program.metadata?.contactPerson,
      contactPhone: program.metadata?.contactPhone,
    };

    return {
      beneficiary: {
        id: beneficiary.id,
        fullName: beneficiary.fullName,
        currentCapital: beneficiary.currentCapital,
        businessType: beneficiary.businessType,
        lastTrackingDate: beneficiary.lastTrackingDate,
      },
      program: programInfo,
      recentTrackings: recentTrackings.map(tracking => ({
        weekEnding: tracking.weekEnding,
        incomeThisWeek: tracking.incomeThisWeek,
        attendance: tracking.attendance,
      })),
      goals: goals.map(goal => ({
        description: goal.description,
        targetAmount: goal.targetAmount,
        currentProgress: goal.currentProgress,
        targetDate: goal.targetDate,
        status: goal.status,
      })),
      faqs,
      emergencyContacts,
      lastUpdated: new Date(),
    };
  }

  async storeOfflineAction(
    userId: string,
    type: OfflineActionType,
    data: any,
  ): Promise<void> {
    const key = `offline:${userId}`;
    const actions = await this.cacheManager.get<OfflineAction[]>(key) || [];
    
    actions.push({
      type,
      data,
      timestamp: new Date(),
    });
    
    await this.cacheManager.set(key, actions, { ttl: 604800 }); // 7 days
  }
}
```

## **Payment Processing with Stripe & Mobile Money**

```typescript
@Injectable()
export class PaymentService {
  constructor(
    private stripeService: StripeService,
    private mobileMoneyService: MobileMoneyService,
    private donationService: DonationService,
    private emailService: EmailService,
    private notificationService: NotificationService,
  ) {}

  async processDonation(
    createDonationDto: CreateDonationDto,
    user: User,
  ): Promise<PaymentResponseDto> {
    const { amount, currency, paymentMethod, projectId, programId } = createDonationDto;

    // Validate payment method
    if (!this.isPaymentMethodSupported(paymentMethod)) {
      throw new BadRequestException('Unsupported payment method');
    }

    // Get payment gateway service
    const gateway = this.getPaymentGateway(paymentMethod);

    // Create payment intent
    const paymentIntent = await gateway.createPaymentIntent({
      amount,
      currency,
      paymentMethod,
      metadata: {
        userId: user.id,
        projectId,
        programId,
        email: user.email,
        phone: user.phone,
      },
    });

    // Create donation record
    const donation = await this.donationService.create({
      ...createDonationDto,
      donorId: user.donor?.id,
      transactionId: paymentIntent.id,
      paymentStatus: PaymentStatus.PENDING,
      metadata: {
        ...createDonationDto.metadata,
        paymentGateway: paymentMethod,
        gatewayResponse: paymentIntent,
      },
    });

    return {
      donation,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
      },
      nextAction: paymentIntent.next_action,
    };
  }

  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'charge.refunded':
        await this.handleRefund(event.data.object as Stripe.Charge);
        break;
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const donation = await this.donationService.findByTransactionId(
      paymentIntent.id,
    );

    if (!donation) {
      throw new Error(`Donation not found for payment intent ${paymentIntent.id}`);
    }

    // Update donation status
    donation.paymentStatus = PaymentStatus.COMPLETED;
    donation.metadata = {
      ...donation.metadata,
      stripePaymentIntent: paymentIntent,
      chargeId: paymentIntent.latest_charge as string,
    };

    await this.donationService.update(donation.id, donation);

    // Update donor total
    await this.updateDonorTotal(donation.donor.id, donation.amount);

    // Send receipt
    await this.sendDonationReceipt(donation);

    // Send notification to admin
    await this.notificationService.sendDonationNotification(donation);
  }

  private async sendDonationReceipt(donation: Donation): Promise<void> {
    const donor = donation.donor;
    
    if (donor.receiptPreference === ReceiptPreference.NONE) {
      return;
    }

    const receiptData = {
      donationId: donation.id,
      amount: donation.amount,
      currency: donation.currency,
      date: donation.createdAt,
      donorName: donor.fullName,
      transactionId: donation.transactionId,
      projectName: donation.project?.name[donor.user.language],
      programName: donation.program?.name[donor.user.language],
    };

    if (donor.receiptPreference === ReceiptPreference.EMAIL && donor.user.email) {
      await this.emailService.sendDonationReceipt(
        donor.user.email,
        receiptData,
        donor.user.language,
      );
    }

    // Also send SMS if enabled
    if (donor.communicationPreferences.sms) {
      await this.notificationService.sendSMS({
        to: donor.user.phone,
        message: `Thank you for your donation of ${donation.amount} ${donation.currency} to LCEO. Receipt: ${donation.receiptNumber}`,
      });
    }
  }
}
```

## **Kobo Toolbox Integration**

```typescript
@Injectable()
export class KoboService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private impactMetricsService: ImpactMetricsService,
    private beneficiariesService: BeneficiariesService,
    private weeklyTrackingService: WeeklyTrackingService,
  ) {}

  async syncFormData(formId: string): Promise<SyncResult> {
    const token = this.configService.get('kobo.token');
    const baseUrl = this.configService.get('kobo.baseUrl');

    try {
      // Fetch submissions from Kobo
      const response = await this.httpService
        .get(`${baseUrl}/api/v2/assets/${formId}/data`, {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        })
        .toPromise();

      const submissions = response.data.results;
      let processed = 0;
      let errors = 0;

      // Process each submission
      for (const submission of submissions) {
        try {
          await this.processSubmission(submission, formId);
          processed++;
        } catch (error) {
          console.error(`Error processing submission ${submission._id}:`, error);
          errors++;
        }
      }

      return {
        success: true,
        processed,
        errors,
        total: submissions.length,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to sync Kobo form ${formId}: ${error.message}`);
    }
  }

  private async processSubmission(
    submission: any,
    formId: string,
  ): Promise<void> {
    // Map Kobo fields to our data model based on form type
    const formMapping = this.getFormMapping(formId);
    
    if (!formMapping) {
      throw new Error(`No mapping found for form ${formId}`);
    }

    switch (formMapping.type) {
      case 'beneficiary_tracking':
        await this.processTrackingSubmission(submission, formMapping);
        break;
        
      case 'program_assessment':
        await this.processAssessmentSubmission(submission, formMapping);
        break;
        
      case 'impact_survey':
        await this.processImpactSubmission(submission, formMapping);
        break;
        
      default:
        throw new Error(`Unknown form type: ${formMapping.type}`);
    }
  }

  private async processTrackingSubmission(
    submission: any,
    mapping: FormMapping,
  ): Promise<void> {
    const beneficiaryId = submission[mapping.fields.beneficiaryId];
    const beneficiary = await this.beneficiariesService.findOne(beneficiaryId);

    if (!beneficiary) {
      throw new Error(`Beneficiary not found: ${beneficiaryId}`);
    }

    // Create weekly tracking from Kobo data
    const trackingData = {
      beneficiaryId: beneficiary.id,
      weekEnding: new Date(submission[mapping.fields.weekEnding]),
      attendance: this.mapAttendance(submission[mapping.fields.attendance]),
      incomeThisWeek: parseFloat(submission[mapping.fields.income] || '0'),
      expensesThisWeek: parseFloat(submission[mapping.fields.expenses] || '0'),
      challenges: submission[mapping.fields.challenges],
      notes: submission[mapping.fields.notes],
      submittedBy: null, // Kobo submissions are system-submitted
      isOfflineSync: false,
      metadata: {
        source: 'kobo',
        formId: mapping.formId,
        submissionId: submission._id,
        submissionDate: submission._submission_time,
      },
    };

    await this.weeklyTrackingService.createFromKobo(trackingData);

    // Update impact metrics
    await this.impactMetricsService.updateFromTracking(
      beneficiary.program.id,
      trackingData,
    );
  }
}
```

## **Admin Dashboard Service**

```typescript
@Injectable()
export class AdminDashboardService {
  constructor(
    private donationService: DonationService,
    private beneficiariesService: BeneficiariesService,
    private programsService: ProgramsService,
    private analyticsService: AnalyticsService,
  ) {}

  async getDashboardStats(
    filters?: DashboardFiltersDto,
  ): Promise<DashboardStatsDto> {
    const [
      totalDonations,
      monthlyRecurring,
      activeBeneficiaries,
      programStats,
      recentDonations,
      upcomingTrackings,
    ] = await Promise.all([
      this.donationService.getTotalDonations(filters),
      this.donationService.getMonthlyRecurringAmount(),
      this.beneficiariesService.getActiveCount(filters),
      this.programsService.getProgramStats(filters),
      this.donationService.getRecentDonations(10),
      this.beneficiariesService.getUpcomingTrackings(7),
    ]);

    return {
      overview: {
        totalDonations,
        monthlyRecurring,
        activeBeneficiaries,
        programsActive: programStats.activePrograms,
        beneficiariesGraduated: programStats.graduatedCount,
      },
      donations: {
        monthlyTrend: await this.analyticsService.getDonationTrend('monthly', 6),
        byProgram: await this.donationService.getDonationsByProgram(),
        byPaymentMethod: await this.donationService.getDonationsByPaymentMethod(),
      },
      beneficiaries: {
        byProgram: await this.beneficiariesService.getDistributionByProgram(),
        byStatus: await this.beneficiariesService.getDistributionByStatus(),
        growthTrend: await this.analyticsService.getBeneficiaryGrowthTrend(),
      },
      programs: {
        budgetUtilization: await this.programsService.getBudgetUtilization(),
        kpiProgress: await this.programsService.getKpiProgress(),
        completionRate: await this.programsService.getCompletionRate(),
      },
      recentActivity: {
        donations: recentDonations,
        upcomingTrackings,
        recentRegistrations: await this.beneficiariesService.getRecentRegistrations(5),
      },
      timestamp: new Date(),
    };
  }

  async generateReport(
    type: ReportType,
    filters: ReportFiltersDto,
  ): Promise<Buffer | string> {
    switch (type) {
      case ReportType.DONATIONS:
        return await this.generateDonationReport(filters);
        
      case ReportType.BENEFICIARIES:
        return await this.generateBeneficiaryReport(filters);
        
      case ReportType.PROGRAMS:
        return await this.generateProgramReport(filters);
        
      case ReportType.FINANCIAL:
        return await this.generateFinancialReport(filters);
        
      default:
        throw new BadRequestException('Invalid report type');
    }
  }

  private async generateDonationReport(
    filters: ReportFiltersDto,
  ): Promise<Buffer> {
    const data = await this.donationService.getReportData(filters);
    
    // Use a PDF generation library like pdfkit
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    
    // Add content to PDF
    doc.fontSize(20).text('LCEO Donation Report', { align: 'center' });
    doc.moveDown();
    
    // Add donation data table
    data.donations.forEach((donation, index) => {
      doc.fontSize(10).text(
        `${index + 1}. ${donation.donorName} - ${donation.amount} ${donation.currency} - ${donation.date}`,
      );
    });
    
    doc.end();
    
    return Buffer.concat(chunks);
  }
}
```

## **Setup & Installation**

### **1. Prerequisites**
```bash
# Install Node.js 18+
# Install PostgreSQL 15+
# Install Redis 7+
# Install Docker (optional)
```

### **2. Clone and Install**
```bash
# Clone the repository
git clone https://github.com/lceo/lceo-backend.git
cd lceo-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your configurations
nano .env
```

### **3. Database Setup**
```bash
# Start PostgreSQL and Redis
# Using Docker:
docker-compose up -d postgres redis

# Or manually install and start services

# Run migrations
npm run migration:run

# Seed initial data (optional)
npm run seed
```

### **4. Development**
```bash
# Start in development mode
npm run start:dev

# The API will be available at http://localhost:3000
# API documentation at http://localhost:3000/api
```

### **5. Production Deployment**
```bash
# Build the application
npm run build

# Start in production mode
npm run start:prod

# Or using PM2
pm2 start dist/main.js --name lceo-api
```

## **Testing**

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

## **API Documentation**

The API is automatically documented using Swagger/OpenAPI. After starting the server, visit:

- Development: `http://localhost:3000/api`
- Production: `https://api.lceo.org/api`

## **Security Considerations**

### **1. Authentication & Authorization**
- JWT tokens with short expiration
- Refresh token rotation
- Role-based access control (RBAC)
- API rate limiting
- IP whitelisting for admin endpoints

### **2. Data Protection**
- Encryption at rest for sensitive data
- SSL/TLS for all communications
- Regular security audits
- GDPR compliance for donor data

### **3. Payment Security**
- PCI DSS compliance through Stripe
- Never store raw payment details
- Use payment gateway tokens
- Regular security scans

## **Monitoring & Maintenance**

### **1. Health Checks**
```bash
# Health check endpoint
GET /health

# Database status
GET /health/db

# Redis status
GET /health/redis
```

### **2. Logging**
- Structured logging with Winston
- Error tracking with Sentry
- Activity logging for audit trails
- Performance monitoring

### **3. Backup Strategy**
```bash
# Automated daily backups
# Off-site backup storage
# Regular restore testing
# Point-in-time recovery
```

## **Deployment with Docker**

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Run migrations
docker-compose exec backend npm run migration:run

# Scale services
docker-compose up -d --scale backend=3
```

## **Troubleshooting**

### **Common Issues**

1. **Database Connection Issues**
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql
   
   # Check connection string in .env
   # Test connection manually
   psql -h localhost -U postgres -d lceo
   ```

2. **Redis Connection Issues**
   ```bash
   # Check if Redis is running
   redis-cli ping
   
   # Should respond with PONG
   ```

3. **Migration Issues**
   ```bash
   # Revert last migration
   npm run migration:revert
   
   # Generate new migration
   npm run migration:generate --name=MigrationName
   ```

4. **Environment Variables**
   ```bash
   # Verify all required variables are set
   node -e "require('dotenv').config(); console.log(process.env)"
   ```

## **Support & Contact**

For technical support:
- Email: tech-support@lceo.org
- Slack: #lceo-tech-team
- GitHub Issues: https://github.com/lceo/lceo-backend/issues

## **License**

This project is proprietary software owned by Life-Changing Endeavor Organization (LCEO). All rights reserved.

---

**Next Steps:**
1. Set up your environment variables in `.env`
2. Run database migrations
3. Seed initial data (admin users, programs)
4. Configure external services (Stripe, Africa's Talking, etc.)
5. Test the USSD flow with a test phone number
6. Set up monitoring and alerts
7. Deploy to production environment

This comprehensive backend architecture provides all the necessary components for LCEO's digital platform, with special attention to:
- **Accessibility** through USSD and offline capabilities
- **Scalability** with modular NestJS structure
- **Security** with proper authentication and data protection
- **Integration** with external services (Kobo, payments, communications)
- **Admin capabilities** for managing beneficiaries, programs, and donations
- **Multi-language support** for English and Kinyarwanda