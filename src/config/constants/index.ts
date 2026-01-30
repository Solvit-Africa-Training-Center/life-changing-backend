// User Types
export enum UserType {
  ADMIN = 'admin',
  DONOR = 'donor',
  BENEFICIARY = 'beneficiary',
}

// Staff Roles (from your staff table)
export enum StaffRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  PROGRAM_MANAGER = 'program_manager',
  DATA_ENTRY = 'data_entry',
  VIEWER = 'viewer',
}

// Languages
export enum Language {
  EN = 'en',
  RW = 'rw',
}

// Beneficiary Status
export enum BeneficiaryStatus {
  ACTIVE = 'active',
  GRADUATED = 'graduated',
  INACTIVE = 'inactive',
}

// Tracking Frequency
export enum TrackingFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

// Attendance Status
export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
}

// Task Completion Status
export enum TaskStatus {
  COMPLETED = 'completed',
  IN_PROGRESS = 'in_progress',
  NOT_DONE = 'not_done',
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
}

// Program Categories
export enum ProgramCategory {
  EDUCATION = 'education',
  ENTREPRENEURSHIP = 'entrepreneurship',
  HEALTH = 'health',
  CROSS_CUTTING = 'cross_cutting',
}

// Program Status
export enum ProgramStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  COMPLETED = 'completed',
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
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
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
}

// Currencies
export enum Currency {
  RWF = 'RWF',
  USD = 'USD',
  EUR = 'EUR',
}

// Receipt Preferences
export enum ReceiptPreference {
  EMAIL = 'email',
  POSTAL = 'postal',
  NONE = 'none',
}

// Document Types
export enum DocumentType {
  ID_CARD = 'id_card',
  BIRTH_CERTIFICATE = 'birth_certificate',
  SCHOOL_CERTIFICATE = 'school_certificate',
  MEDICAL_REPORT = 'medical_report',
  BUSINESS_LICENSE = 'business_license',
  OTHER = 'other',
}

// Document Status
export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// Notification Types
export enum NotificationType {
  DONATION_RECEIPT = 'donation_receipt',
  TRACKING_REMINDER = 'tracking_reminder',
  PROGRAM_UPDATE = 'program_update',
  IMPACT_REPORT = 'impact_report',
  SYSTEM_ALERT = 'system_alert',
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
}

// Notification Status
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read',
}

// Notification Channel
export enum NotificationChannel {
  SMS = 'sms',
  EMAIL = 'email',
  IN_APP = 'in_app',
}

// Impact Metric Period
export enum MetricPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}

// Impact Metric Source
export enum MetricSource {
  KOBO = 'kobo',
  MANUAL = 'manual',
  SYSTEM_CALCULATED = 'system_calculated',
}

// Author Roles
export enum AuthorRole {
  BENEFICIARY = 'beneficiary',
  DONOR = 'donor',
  STAFF = 'staff',
  PARTNER = 'partner',
  VOLUNTEER = 'volunteer',
}

// Constants
export const API_PREFIX = '/api/v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const CACHE_TTL = 3600;
export const USSD_TIMEOUT = 180; // seconds