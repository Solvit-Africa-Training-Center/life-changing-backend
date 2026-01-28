// src/modules/ussd/ussd.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as AfricasTalking from 'africastalking';

import { UssdSession } from './entities/ussd-session.entity';
import { UssdRequestDto } from './dto/ussd-request.dto';
import { UsersService } from '../users/users.service';
import { BeneficiariesService } from '../beneficiaries/beneficiaries.service';
import { StaffService } from '../users/staff.service';
import { WeeklyTrackingService } from '../beneficiaries/weekly-tracking.service';
import { NotificationService } from '../notifications/notifications.service';

// Import all your constants
import {
  UserType,
  StaffRole,
  Language,
  BeneficiaryStatus,
  TrackingFrequency,
  AttendanceStatus,
  TaskStatus,
  GoalType,
  GoalStatus,
  ProgramCategory,
  ProgramStatus,
  PaymentMethod,
  PaymentStatus,
  DonationType,
  RecurringFrequency,
  RecurringStatus,
  Currency,
  ReceiptPreference,
  DocumentType,
  NotificationType,
  NotificationStatus,
  NotificationChannel,
  MetricPeriod,
  MetricSource,
  AuthorRole,
  USSD_TIMEOUT,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  CACHE_TTL
} from '../../config/constants';

@Injectable()
export class UssdService {
  private readonly logger = new Logger(UssdService.name);
  private readonly atClient: any;

  constructor(
    @InjectRepository(UssdSession)
    private ussdSessionRepository: Repository<UssdSession>,
    private configService: ConfigService,
    private usersService: UsersService,
    private beneficiariesService: BeneficiariesService,
    private staffService: StaffService,
    private weeklyTrackingService: WeeklyTrackingService,
    private notificationService: NotificationService,
  ) {
    // Initialize Africa's Talking USSD with your config
    const apiKey = this.configService.get('config.africasTalking.apiKey');
    const username = this.configService.get('config.africasTalking.username');

    if (apiKey && username) {
      this.atClient = AfricasTalking({
        apiKey,
        username,
      }).USSD;
    }
  }

  async handleUssdRequest(ussdRequest: UssdRequestDto): Promise<string> {
    const { phoneNumber, sessionId, serviceCode, text, networkCode, language } = ussdRequest;
    
    // Normalize phone number
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    
    // Find or create session
    let session = await this.ussdSessionRepository.findOne({
      where: { sessionId },
    });

    if (!session) {
      session = await this.createSession(ussdRequest, formattedPhone);
    } else {
      await this.updateSession(session, ussdRequest);
    }

    // Determine user type if not already identified
    if (!session.userType) {
      await this.identifyUser(session, formattedPhone);
    }

    // Process the USSD request
    const response = await this.processUssdFlow(session, text);

    // Update session
    session.lastInteraction = new Date();
    session.stepCount += 1;
    
    if (response.endsWith('END')) {
      session.isActive = false;
    }

    await this.ussdSessionRepository.save(session);

    return response;
  }

  private async createSession(
    ussdRequest: UssdRequestDto, 
    formattedPhone: string
  ): Promise<UssdSession> {
    const session = this.ussdSessionRepository.create({
      phoneNumber: formattedPhone,
      sessionId: ussdRequest.sessionId,
      menuState: 'main_menu',
      language: this.mapLanguage(ussdRequest.language || Language.EN),
      data: {
        currentMenu: 'main_menu',
        previousMenu: null,
        selectedOptions: {},
        inputHistory: [],
      },
      stepCount: 0,
      lastInteraction: new Date(),
      expiresAt: new Date(Date.now() + USSD_TIMEOUT * 1000),
      isActive: true,
      metadata: {
        network: ussdRequest.networkCode || 'unknown',
        device: 'USSD',
        serviceCode: ussdRequest.serviceCode,
      },
    });

    return await this.ussdSessionRepository.save(session);
  }

  private async updateSession(
    session: UssdSession, 
    ussdRequest: UssdRequestDto
  ): Promise<void> {
    session.lastInteraction = new Date();
    session.expiresAt = new Date(Date.now() + USSD_TIMEOUT * 1000);
    
    // Update input history
    if (ussdRequest.text) {
      if (!session.data.inputHistory) {
        session.data.inputHistory = [];
      }
      session.data.inputHistory.push(ussdRequest.text);
    }
  }

  private mapLanguage(lang: string): Language {
    switch (lang.toLowerCase()) {
      case 'rw':
      case 'kin':
      case 'kinyarwanda':
        return Language.RW;
      case 'en':
      case 'eng':
      case 'english':
      default:
        return Language.EN;
    }
  }

  private async identifyUser(
    session: UssdSession, 
    phoneNumber: string
  ): Promise<void> {
    try {
      // Try to find user by phone
      const user = await this.usersService.findByPhone(phoneNumber);
      
      if (user) {
        session.userType = user.userType as UserType;
        session.data.userId = user.id;

        // Find beneficiary or staff if applicable
        switch (user.userType) {
          case UserType.BENEFICIARY:
            const beneficiary = await this.beneficiariesService.findByUserId(user.id);
            if (beneficiary) {
              session.data.beneficiaryId = beneficiary.id;
              
              // Check beneficiary status
              if (beneficiary.status !== BeneficiaryStatus.ACTIVE) {
                session.data.selectedOptions = {
                  ...session.data.selectedOptions,
                  beneficiaryStatus: beneficiary.status,
                  isActive: false,
                };
              }
            }
            break;
            
          case UserType.ADMIN:
          case UserType.DONOR:
            const staff = await this.staffService.findByUserId(user.id);
            if (staff) {
              session.data.staffId = staff.id;
              
              // Check staff role for access control
              if (staff.role) {
                session.data.selectedOptions = {
                  ...session.data.selectedOptions,
                  staffRole: staff.role,
                };
              }
            }
            break;
        }
      }
    } catch (error) {
      this.logger.error(`Error identifying user for phone ${phoneNumber}:`, error);
    }
  }

  private async processUssdFlow(
    session: UssdSession, 
    input?: string
  ): Promise<string> {
    const isFirstRequest = !input || input.trim() === '';
    
    // Update menu tracking
    if (isFirstRequest) {
      session.data.previousMenu = null;
      session.data.currentMenu = 'main_menu';
    } else {
      session.data.previousMenu = session.data.currentMenu;
    }

    // Handle menu navigation with constants
    switch (session.data.currentMenu) {
      case 'main_menu':
        return await this.handleMainMenu(session, input, isFirstRequest);
      
      case 'beneficiary_menu':
        return await this.handleBeneficiaryMenu(session, input);
      
      case 'weekly_tracking':
        return await this.handleWeeklyTracking(session, input);
      
      case 'goal_tracking':
        return await this.handleGoalTracking(session, input);
      
      case 'staff_menu':
        return await this.handleStaffMenu(session, input);
      
      case 'donation_menu':
        return await this.handleDonationMenu(session, input);
      
      case 'emergency_menu':
        return await this.handleEmergencyMenu(session, input);
      
      default:
        return this.getErrorMessage(session.language);
    }
  }

  private async handleMainMenu(
    session: UssdSession, 
    input: string | undefined, 
    isFirstRequest: boolean
  ): Promise<string> {
    if (isFirstRequest) {
      return this.getMainMenu(session.language, session.userType);
    }

    switch (input) {
      case '1':
        // Beneficiary Services
        if (session.userType === UserType.BENEFICIARY) {
          session.data.currentMenu = 'beneficiary_menu';
          return this.getBeneficiaryMenu(session.language);
        } else {
          return this.getAccessDeniedMessage(session.language);
        }
      
      case '2':
        // Staff Services
        if (session.userType === UserType.ADMIN) {
          session.data.currentMenu = 'staff_menu';
          return this.getStaffMenu(session.language);
        } else {
          return this.getAccessDeniedMessage(session.language);
        }
      
      case '3':
        // Donor Services
        if (session.userType === UserType.DONOR) {
          session.data.currentMenu = 'donation_menu';
          return this.getDonationMenu(session.language);
        } else {
          // Allow anyone to donate
          session.data.currentMenu = 'donation_menu';
          return this.getDonationMenu(session.language);
        }
      
      case '4':
        // Program Information
        return await this.getProgramInformation(session);
      
      case '5':
        // Emergency Contact
        session.data.currentMenu = 'emergency_menu';
        return this.getEmergencyMenu(session.language);
      
      case '0':
        // Exit
        return this.getExitMessage(session.language);
      
      default:
        return this.getInvalidOptionMessage(session.language);
    }
  }

  private async handleBeneficiaryMenu(
    session: UssdSession, 
    input: string
  ): Promise<string> {
    if (!session.data.beneficiaryId) {
      return this.getErrorMessage(
        session.language, 
        'You need to be a registered beneficiary to access this service.'
      );
    }

    // Check beneficiary status
    const beneficiary = await this.beneficiariesService.findById(
      session.data.beneficiaryId
    );
    
    if (beneficiary?.status !== BeneficiaryStatus.ACTIVE) {
      return this.getErrorMessage(
        session.language,
        `Your account status is: ${beneficiary?.status}. Please contact support.`
      );
    }

    switch (input) {
      case '1':
        // Weekly Tracking
        session.data.currentMenu = 'weekly_tracking';
        session.data.trackingData = {
          attendance: AttendanceStatus.PRESENT, // Default
        };
        return this.getWeeklyTrackingQuestion(session.language, 1);
      
      case '2':
        // Goal Progress
        session.data.currentMenu = 'goal_tracking';
        return await this.getGoalProgress(session);
      
      case '3':
        // View My Info
        return await this.getBeneficiaryInfo(session);
      
      case '4':
        // Request Support
        return await this.getSupportRequest(session);
      
      case '5':
        // View Program Details
        return await this.getProgramDetails(session);
      
      case '0':
        // Back to Main Menu
        session.data.currentMenu = 'main_menu';
        return this.getMainMenu(session.language, session.userType);
      
      default:
        return this.getInvalidOptionMessage(session.language);
    }
  }

  private async handleWeeklyTracking(
    session: UssdSession, 
    input: string
  ): Promise<string> {
    const step = session.data.selectedOptions?.trackingStep || 1;
    
    if (!session.data.trackingData) {
      session.data.trackingData = {};
    }

    // Store response based on step
    switch (step) {
      case 1: // Income
        const income = parseFloat(input);
        if (isNaN(income) || income < 0) {
          return this.getInvalidInputMessage(session.language, 'income');
        }
        session.data.trackingData.incomeThisWeek = income;
        break;
      
      case 2: // Expenses
        const expenses = parseFloat(input);
        if (isNaN(expenses) || expenses < 0) {
          return this.getInvalidInputMessage(session.language, 'expenses');
        }
        session.data.trackingData.expensesThisWeek = expenses;
        break;
      
      case 3: // Current Capital
        const capital = parseFloat(input);
        if (isNaN(capital) || capital < 0) {
          return this.getInvalidInputMessage(session.language, 'capital');
        }
        session.data.trackingData.currentCapital = capital;
        break;
      
      case 4: // Attendance
        const attendance = this.mapAttendance(input, session.language);
        session.data.trackingData.attendance = attendance;
        break;
      
      case 5: // Challenges
        session.data.trackingData.challenges = input;
        break;
      
      case 6: // Solutions
        session.data.trackingData.solutionsImplemented = input;
        
        // Submit tracking data
        await this.submitWeeklyTracking(session);
        
        // Return to beneficiary menu
        session.data.currentMenu = 'beneficiary_menu';
        delete session.data.selectedOptions.trackingStep;
        
        return this.getSuccessMessage(
          session.language, 
          'Weekly tracking submitted successfully!'
        );
    }

    // Move to next step
    if (!session.data.selectedOptions) {
      session.data.selectedOptions = {};
    }
    session.data.selectedOptions.trackingStep = step + 1;
    
    if (step + 1 <= 6) {
      return this.getWeeklyTrackingQuestion(session.language, step + 1);
    } else {
      return this.getErrorMessage(session.language);
    }
  }

  private mapAttendance(input: string, language: Language): AttendanceStatus {
    switch (input) {
      case '1':
        return AttendanceStatus.PRESENT;
      case '2':
        return AttendanceStatus.ABSENT;
      case '3':
        return AttendanceStatus.LATE;
      default:
        return AttendanceStatus.ABSENT;
    }
  }

  private async submitWeeklyTracking(session: UssdSession): Promise<void> {
    try {
      if (!session.data.beneficiaryId || !session.data.trackingData) {
        return;
      }

      const trackingData = {
        beneficiaryId: session.data.beneficiaryId,
        weekEnding: new Date(),
        attendance: session.data.trackingData.attendance || AttendanceStatus.PRESENT,
        incomeThisWeek: session.data.trackingData.incomeThisWeek || 0,
        expensesThisWeek: session.data.trackingData.expensesThisWeek || 0,
        currentCapital: session.data.trackingData.currentCapital || 0,
        challenges: session.data.trackingData.challenges || '',
        solutionsImplemented: session.data.trackingData.solutionsImplemented || '',
        submittedBy: session.data.staffId || null,
        isOfflineSync: true,
        syncSessionId: session.sessionId,
        metadata: {
          submittedVia: 'USSD',
          language: session.language,
          phoneNumber: session.phoneNumber,
        },
      };

      await this.weeklyTrackingService.create(trackingData);
      
      // Send confirmation notification
      await this.notificationService.sendNotification({
        userId: session.data.userId,
        type: NotificationType.TRACKING_REMINDER,
        channel: NotificationChannel.SMS,
        status: NotificationStatus.PENDING,
        title: 'Tracking Submitted',
        message: 'Your weekly tracking has been submitted successfully!',
        metadata: {
          sessionId: session.sessionId,
          beneficiaryId: session.data.beneficiaryId,
        },
      });
    } catch (error) {
      this.logger.error('Error submitting weekly tracking:', error);
    }
  }

  private async handleGoalTracking(
    session: UssdSession, 
    input: string
  ): Promise<string> {
    // Implementation using GoalStatus and GoalType enums
    // Similar pattern to weekly tracking
    return this.getComingSoonMessage(session.language);
  }

  private async handleStaffMenu(
    session: UssdSession, 
    input: string
  ): Promise<string> {
    // Check staff role for access control
    const staffRole = session.data.selectedOptions?.staffRole;
    
    if (!staffRole) {
      return this.getAccessDeniedMessage(session.language);
    }

    // Restrict certain features based on role
    switch (input) {
      case '1': // Beneficiary Tracking
        if (![StaffRole.ADMIN, StaffRole.PROGRAM_MANAGER, StaffRole.DATA_ENTRY].includes(staffRole)) {
          return this.getAccessDeniedMessage(session.language);
        }
        return await this.handleStaffTracking(session);
      
      case '2': // Attendance Marking
        if (![StaffRole.ADMIN, StaffRole.PROGRAM_MANAGER, StaffRole.DATA_ENTRY].includes(staffRole)) {
          return this.getAccessDeniedMessage(session.language);
        }
        return await this.handleAttendanceMarking(session);
      
      case '0': // Back
        session.data.currentMenu = 'main_menu';
        return this.getMainMenu(session.language, session.userType);
      
      default:
        return this.getInvalidOptionMessage(session.language);
    }
  }

  private async handleDonationMenu(
    session: UssdSession, 
    input: string
  ): Promise<string> {
    // Implementation using DonationType, Currency, PaymentMethod enums
    // Example:
    switch (input) {
      case '1': // 1,000 RWF
        session.data.donationData = {
          amount: 1000,
          currency: Currency.RWF,
          paymentMethod: PaymentMethod.MOBILE_MONEY,
        };
        return this.getPaymentConfirmation(session);
      
      case '2': // 5,000 RWF
        session.data.donationData = {
          amount: 5000,
          currency: Currency.RWF,
          paymentMethod: PaymentMethod.MOBILE_MONEY,
        };
        return this.getPaymentConfirmation(session);
      
      // ... other options
      
      case '0': // Back
        session.data.currentMenu = 'main_menu';
        return this.getMainMenu(session.language, session.userType);
      
      default:
        return this.getInvalidOptionMessage(session.language);
    }
  }

  private async handleEmergencyMenu(
    session: UssdSession, 
    input: string
  ): Promise<string> {
    // Emergency contact implementation
    return this.getComingSoonMessage(session.language);
  }

  // Menu generation methods with constants
  private getMainMenu(language: Language, userType?: UserType): string {
    const menus = {
      [Language.EN]: {
        title: 'LCEO - Life Changing Endeavor\n',
        options: [
          '1. Beneficiary Services',
          '2. Staff Services',
          '3. Donate Now',
          '4. Program Information',
          '5. Emergency Contact',
          '0. Exit'
        ]
      },
      [Language.RW]: {
        title: 'LCEO - Gahunda yo Guhindura Ubuzima\n',
        options: [
          '1. Serivisi z\'Abakiriya',
          '2. Serivisi z\'Abakozi',
          '3. Tanga ubutanze',
          '4. Amakuru y\'Ingamba',
          '5. Kuvugana n\'Abafata amezi',
          '0. Gusohoka'
        ]
      }
    };

    const menu = menus[language];
    let response = menu.title;
    
    // Filter options based on user type
    const availableOptions = menu.options.filter(option => {
      if (userType === UserType.BENEFICIARY) {
        return !option.includes('Staff Services') && !option.includes('Serivisi z\'Abakozi');
      }
      return true;
    });

    response += availableOptions.join('\n');
    response += '\n\nEnter option:';
    
    return `CON ${response}`;
  }

  private getBeneficiaryMenu(language: Language): string {
    const menus = {
      [Language.EN]: {
        title: 'Beneficiary Services\n',
        options: [
          '1. Weekly Tracking',
          '2. Goal Progress',
          '3. View My Info',
          '4. Request Support',
          '5. View Program Details',
          '0. Back to Main Menu'
        ]
      },
      [Language.RW]: {
        title: 'Serivisi z\'Abakiriya\n',
        options: [
          '1. Gukurikirana icyumweru',
          '2. Gukurikirana Intego',
          '3. Reba Amakuru yanjye',
          '4. Saba Inkunga',
          '5. Reba Ibisobanuro by\'Ingamba',
          '0. Subira ku Menu nyamukuru'
        ]
      }
    };

    const menu = menus[language];
    return `CON ${menu.title}${menu.options.join('\n')}\n\nEnter option:`;
  }

  private getWeeklyTrackingQuestion(language: Language, step: number): string {
    const questions = {
      [Language.EN]: {
        1: 'Enter your income this week (RWF):',
        2: 'Enter your expenses this week (RWF):',
        3: 'Enter your current capital (RWF):',
        4: 'Were you present this week?\n1. Yes\n2. No\n3. Late',
        5: 'Any challenges faced? (Text reply)',
        6: 'Solutions implemented? (Text reply)'
      },
      [Language.RW]: {
        1: 'Andika amafaranga y\'inzira wakiriye icyumweru (RWF):',
        2: 'Andika amafaranga yakoreshejwe icyumweru (RWF):',
        3: 'Andika amafaranga y\'ikigega ufite ubu (RWF):',
        4: 'Wari uhagaze icyumweru?\n1. Yego\n2. Oya\n3. Waje nyuma',
        5: 'Harimo ibibazo? (Andika ibisubizo)',
        6: 'Ibisubizo byakozwe? (Andika ibisubizo)'
      }
    };

    const question = questions[language][step];
    return `CON ${question}\n\nEnter response:`;
  }

  private getStaffMenu(language: Language): string {
    const menus = {
      [Language.EN]: {
        title: 'Staff Services\n',
        options: [
          '1. Beneficiary Tracking',
          '2. Attendance Marking',
          '3. Data Synchronization',
          '4. Task Assignment',
          '5. View Reports',
          '0. Back to Main Menu'
        ]
      },
      [Language.RW]: {
        title: 'Serivisi z\'Abakozi\n',
        options: [
          '1. Gukurikirana Abakiriya',
          '2. Gukora Inyandiko y\'Abahagaze',
          '3. Kubumisha Amakuru',
          '4. Gushyiraho Imirimo',
          '5. Reba Raporo',
          '0. Subira ku Menu nyamukuru'
        ]
      }
    };

    const menu = menus[language];
    return `CON ${menu.title}${menu.options.join('\n')}\n\nEnter option:`;
  }

  // Helper methods using constants
  private formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.startsWith('250')) {
      return `+${digits}`;
    } else if (digits.startsWith('0')) {
      return `+250${digits.substring(1)}`;
    } else if (digits.length === 9) {
      return `+250${digits}`;
    }
    
    return `+${digits}`;
  }

  private getErrorMessage(language: Language, customMessage?: string): string {
    const messages = {
      [Language.EN]: customMessage || 'An error occurred. Please try again later.',
      [Language.RW]: customMessage || 'Habaye ikosa. Ongera ugerageze nyuma.'
    };
    
    return `END ${messages[language]}`;
  }

  private getSuccessMessage(language: Language, message: string): string {
    const messages = {
      [Language.EN]: message,
      [Language.RW]: message // Add proper translations
    };
    
    return `END ${messages[language]}`;
  }

  private getInvalidOptionMessage(language: Language): string {
    const messages = {
      [Language.EN]: 'Invalid option. Please try again.',
      [Language.RW]: 'Option ntabwo ari yo. Ongera ugerageze.'
    };
    
    return `CON ${messages[language]}\n\nEnter option:`;
  }

  private getInvalidInputMessage(language: Language, field: string): string {
    const messages = {
      [Language.EN]: `Invalid ${field}. Please enter a valid number.`,
      [Language.RW]: `${field} ntabwo ari yo. Andika umubare ukwiye.`
    };
    
    return `CON ${messages[language]}\n\nEnter ${field}:`;
  }

  private getAccessDeniedMessage(language: Language): string {
    const messages = {
      [Language.EN]: 'Access denied. You do not have permission for this service.',
      [Language.RW]: 'Ntabwo wemerewe. Nta uburenganzira ufite kuri serivisi.'
    };
    
    return `END ${messages[language]}`;
  }

  private getExitMessage(language: Language): string {
    const messages = {
      [Language.EN]: 'Thank you for using LCEO USSD service. Goodbye!',
      [Language.RW]: 'Murakoze gukoresha serivisi ya LCEO. Murabeho!'
    };
    
    return `END ${messages[language]}`;
  }

  private getComingSoonMessage(language: Language): string {
    const messages = {
      [Language.EN]: 'This feature is coming soon!',
      [Language.RW]: 'Iyi serivisi izaza vuba!'
    };
    
    return `END ${messages[language]}`;
  }

  // Clean up expired sessions using USSD_TIMEOUT constant
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const expirationTime = new Date(Date.now() - USSD_TIMEOUT * 1000);
      
      const result = await this.ussdSessionRepository
        .createQueryBuilder()
        .delete()
        .where('expires_at < :expirationTime', { expirationTime })
        .orWhere('is_active = false')
        .execute();
      
      this.logger.log(`Cleaned up ${result.affected} expired USSD sessions`);
    } catch (error) {
      this.logger.error('Error cleaning up USSD sessions:', error);
    }
  }

  // Get session statistics with pagination constants
  async getSessionStats(page: number = 1, limit: number = DEFAULT_PAGE_SIZE): Promise<any> {
    const take = Math.min(limit, MAX_PAGE_SIZE);
    const skip = (page - 1) * take;

    const [sessions, total] = await this.ussdSessionRepository.findAndCount({
      take,
      skip,
      order: { createdAt: 'DESC' },
    });

    const active = await this.ussdSessionRepository.count({ 
      where: { isActive: true } 
    });

    const byUserType = await this.ussdSessionRepository
      .createQueryBuilder()
      .select('user_type, COUNT(*) as count')
      .where('user_type IS NOT NULL')
      .groupBy('user_type')
      .getRawMany();

    const byLanguage = await this.ussdSessionRepository
      .createQueryBuilder()
      .select('language, COUNT(*) as count')
      .groupBy('language')
      .getRawMany();

    return {
      total,
      active,
      page,
      pageSize: take,
      totalPages: Math.ceil(total / take),
      sessions: sessions.map(s => ({
        id: s.id,
        phoneNumber: s.phoneNumber,
        userType: s.userType,
        language: s.language,
        stepCount: s.stepCount,
        createdAt: s.createdAt,
        isActive: s.isActive,
      })),
      byUserType: byUserType.reduce((acc, curr) => {
        acc[curr.user_type] = parseInt(curr.count);
        return acc;
      }, {}),
      byLanguage: byLanguage.reduce((acc, curr) => {
        acc[curr.language] = parseInt(curr.count);
        return acc;
      }, {}),
    };
  }
}