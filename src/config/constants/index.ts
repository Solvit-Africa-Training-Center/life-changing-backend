// // Enums
// export enum UserType {
//   SUPER_ADMIN = 'super_admin',
//   ADMIN = 'admin',
//   STAFF = 'staff',
//   DONOR = 'donor',
//   BENEFICIARY = 'beneficiary',
// }

// export enum Language {
//   EN = 'en',
//   RW = 'rw',
//   BOTH = 'both',
// }

// export enum BeneficiaryStatus {
//   ACTIVE = 'active',
//   GRADUATED = 'graduated',
//   INACTIVE = 'inactive',
//   SUSPENDED = 'suspended',
// }

// export enum ProgramCategory {
//   EDUCATION = 'education',
//   ENTREPRENEURSHIP = 'entrepreneurship',
//   HEALTH = 'health',
//   CROSS_CUTTING = 'cross_cutting',
//   EMERGENCY_RESPONSE = 'emergency_response',
// }

// export enum PaymentMethod {
//   CARD = 'card',
//   MOBILE_MONEY = 'mobile_money',
//   BANK_TRANSFER = 'bank_transfer',
//   PAYPAL = 'paypal',
// }

// export enum DonationType {
//   ONE_TIME = 'one_time',
//   MONTHLY = 'monthly',
//   QUARTERLY = 'quarterly',
//   YEARLY = 'yearly',
// }

// export enum AttendanceStatus {
//   PRESENT = 'present',
//   ABSENT = 'absent',
//   LATE = 'late',
//   EXCUSED = 'excused',
// }

// // Constants
// export const API_PREFIX = '/api/v1';
// export const DEFAULT_PAGE_SIZE = 20;
// export const MAX_PAGE_SIZE = 100;
// export const CACHE_TTL = 3600;
// export const USSD_TIMEOUT = 180; // seconds

// User Types
export enum UserType {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  STAFF = 'staff',
  DONOR = 'donor',
  BENEFICIARY = 'beneficiary',
}

// Staff Roles
export enum StaffRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  PROGRAM_MANAGER = 'program_manager',
  FIELD_OFFICER = 'field_officer',
  DATA_ENTRY = 'data_entry',
  VIEWER = 'viewer',
}

// Languages
export enum Language {
  EN = 'en',
  RW = 'rw',
  BOTH = 'both',
}

// Beneficiary Status
export enum BeneficiaryStatus {
  ACTIVE = 'active',
  GRADUATED = 'graduated',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

// Tracking Frequency
export enum TrackingFrequency {
  WEEKLY = 'weekly',
  BI_WEEKLY = 'bi_weekly',
  MONTHLY = 'monthly',
}

// Attendance Status
export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

// Task Status
export enum TaskStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
  NOT_DONE = 'not_done',
  PARTIALLY_DONE = 'partially_done',
}

// Goal Types
export enum GoalType {
  FINANCIAL = 'financial',
  BUSINESS = 'business',
  EDUCATION = 'education',
  PERSONAL = 'personal',
  SKILLS = 'skills',
}

// Goal Status
export enum GoalStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  ACHIEVED = 'achieved',
  ABANDONED = 'abandoned',
  ON_HOLD = 'on_hold',
}

// Program Categories
export enum ProgramCategory {
  EDUCATION = 'education',
  ENTREPRENEURSHIP = 'entrepreneurship',
  HEALTH = 'health',
  CROSS_CUTTING = 'cross_cutting',
  EMERGENCY_RESPONSE = 'emergency_response',
}

// Program Status
export enum ProgramStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
}

// Payment Methods
export enum PaymentMethod {
  CARD = 'card',
  MOBILE_MONEY = 'mobile_money',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
}

// Payment Status
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

// Donation Types
export enum DonationType {
  ONE_TIME = 'one_time',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

// Recurring Frequency
export enum RecurringFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

// Recurring Status
export enum RecurringStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

// Currencies
export enum Currency {
  RWF = 'RWF',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
}

// Receipt Preferences
export enum ReceiptPreference {
  EMAIL = 'email',
  POSTAL = 'postal',
  NONE = 'none',
}

// System Constants
export const API_PREFIX = '/api/v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const CACHE_TTL = 3600;
export const USSD_TIMEOUT = 180; // seconds
export const DEFAULT_CURRENCY = Currency.RWF;
export const SUPPORTED_CURRENCIES = [Currency.RWF, Currency.USD, Currency.EUR];