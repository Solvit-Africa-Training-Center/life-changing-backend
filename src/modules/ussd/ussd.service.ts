// // src/modules/ussd/ussd.service.ts
// import { Injectable, Logger, NotFoundException } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, Between, MoreThan, LessThan } from 'typeorm';
// import * as AfricasTalking from 'africastalking';
// import * as moment from 'moment';

// import { UssdSession } from './entities/ussd-session.entity';
// import { UssdRequestDto, UssdResponseDto, UssdStatsDto } from './dto/ussd-request.dto';
// import { UsersService } from '../users/users.service';
// import { BeneficiariesService } from '../beneficiaries/services/beneficiaries.service';
// import { StaffService } from '../users/staff.service';
// import { WeeklyTrackingService } from '../beneficiaries/weekly-tracking.service';
// import { NotificationService } from '../notifications/notifications.service';
// import { GoalsService } from '../goals/goals.service';
// import { DonationsService } from '../donations/services/donations.service';
// import { ProgramsService } from '../programs/programs.service';

// import {
//   UserType,
//   StaffRole,
//   Language,
//   BeneficiaryStatus,
//   TrackingFrequency,
//   AttendanceStatus,
//   TaskStatus,
//   GoalType,
//   GoalStatus,
//   ProgramCategory,
//   ProgramStatus,
//   PaymentMethod,
//   PaymentStatus,
//   DonationType,
//   RecurringFrequency,
//   RecurringStatus,
//   Currency,
//   ReceiptPreference,
//   DocumentType,
//   NotificationType,
//   NotificationStatus,
//   NotificationChannel,
//   MetricPeriod,
//   MetricSource,
//   AuthorRole,
//   USSD_TIMEOUT,
//   DEFAULT_PAGE_SIZE,
//   MAX_PAGE_SIZE,
//   CACHE_TTL,
//   API_PREFIX
// } from '../../config/constants';

// @Injectable()
// export class UssdService {
//   private readonly logger = new Logger(UssdService.name);
//   private readonly atClient: any;

//   constructor(
//     @InjectRepository(UssdSession)
//     private ussdSessionRepository: Repository<UssdSession>,
//     private configService: ConfigService,
//     private usersService: UsersService,
//     private beneficiariesService: BeneficiariesService,
//     private staffService: StaffService,
//     private weeklyTrackingService: WeeklyTrackingService,
//     private notificationService: NotificationService,
//     private goalsService: GoalsService,
//     private donationsService: DonationsService,
//     private programsService: ProgramsService,
//   ) {
//     // Initialize Africa's Talking USSD
//     this.initializeAfricasTalking();
//   }

//   private initializeAfricasTalking(): void {
//     try {
//       const apiKey = this.configService.get('config.africasTalking.apiKey');
//       const username = this.configService.get('config.africasTalking.username');

//       if (apiKey && username) {
//         this.atClient = AfricasTalking({
//           apiKey,
//           username,
//         }).USSD;
//         this.logger.log('Africa\'s Talking USSD client initialized');
//       } else {
//         this.logger.warn('Africa\'s Talking credentials not found. Using mock mode.');
//       }
//     } catch (error) {
//       this.logger.error('Failed to initialize Africa\'s Talking:', error);
//     }
//   }

//   // ==================== MAIN USSD HANDLER ====================
//   async handleUssdRequest(ussdRequest: UssdRequestDto): Promise<string> {
//     try {
//       const { phoneNumber, sessionId, serviceCode, text, networkCode, language } = ussdRequest;
      
//       // Validate service code
//       if (!this.isValidServiceCode(serviceCode)) {
//         return this.getErrorMessage(Language.EN, 'Invalid service code.');
//       }

//       // Normalize phone number
//       const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
//       // Find or create session
//       let session = await this.findOrCreateSession(ussdRequest, formattedPhone);

//       // Determine user type if not already identified
//       if (!session.userType) {
//         await this.identifyUser(session, formattedPhone);
//       }

//       // Process the USSD request
//       const response = await this.processUssdFlow(session, text);

//       // Update session
//       await this.updateSessionAfterResponse(session, response);

//       this.logger.log(`USSD processed: ${phoneNumber}, State: ${session.menuState}, Steps: ${session.stepCount}`);
//       return response;

//     } catch (error) {
//       this.logger.error('Error handling USSD request:', error);
//       return this.getErrorMessage(Language.EN, 'System error. Please try again.');
//     }
//   }

//   // ==================== SESSION MANAGEMENT ====================
//   private async findOrCreateSession(
//     ussdRequest: UssdRequestDto, 
//     formattedPhone: string
//   ): Promise<UssdSession> {
//     let session = await this.ussdSessionRepository.findOne({
//       where: { sessionId: ussdRequest.sessionId },
//     });

//     if (!session) {
//       session = await this.createSession(ussdRequest, formattedPhone);
//     } else {
//       await this.updateSession(session, ussdRequest);
//     }

//     return session;
//   }

//   private async createSession(
//     ussdRequest: UssdRequestDto, 
//     formattedPhone: string
//   ): Promise<UssdSession> {
//     const session = this.ussdSessionRepository.create({
//       phoneNumber: formattedPhone,
//       sessionId: ussdRequest.sessionId,
//       menuState: 'main_menu',
//       language: this.mapLanguage(ussdRequest.language || Language.EN),
//       data: {
//         currentMenu: 'main_menu',
//         previousMenu: null,
//         selectedOptions: {},
//         inputHistory: [],
//         metadata: {
//           serviceCode: ussdRequest.serviceCode,
//           startTime: new Date(),
//         },
//       },
//       stepCount: 0,
//       lastInteraction: new Date(),
//       expiresAt: new Date(Date.now() + USSD_TIMEOUT * 1000),
//       isActive: true,
//       metadata: {
//         network: ussdRequest.networkCode || 'unknown',
//         device: 'USSD',
//         serviceCode: ussdRequest.serviceCode,
//         networkCode: ussdRequest.networkCode,
//       },
//     });

//     return await this.ussdSessionRepository.save(session);
//   }

//   private async updateSession(
//     session: UssdSession, 
//     ussdRequest: UssdRequestDto
//   ): Promise<void> {
//     session.lastInteraction = new Date();
//     session.expiresAt = new Date(Date.now() + USSD_TIMEOUT * 1000);
    
//     // Update input history
//     if (ussdRequest.text) {
//       if (!session.data.inputHistory) {
//         session.data.inputHistory = [];
//       }
//       session.data.inputHistory.push(ussdRequest.text);
      
//       // Keep only last 10 inputs
//       if (session.data.inputHistory.length > 10) {
//         session.data.inputHistory = session.data.inputHistory.slice(-10);
//       }
//     }

//     await this.ussdSessionRepository.save(session);
//   }

//   private async updateSessionAfterResponse(
//     session: UssdSession, 
//     response: string
//   ): Promise<void> {
//     session.lastInteraction = new Date();
//     session.stepCount += 1;
    
//     // Update menu state from data.currentMenu
//     session.menuState = session.data.currentMenu || 'main_menu';
    
//     if (response.endsWith('END')) {
//       session.isActive = false;
//       session.completedAt = new Date();
      
//       // Calculate session duration
//       if (session.data.metadata?.startTime) {
//         const duration = moment().diff(moment(session.data.metadata.startTime), 'seconds');
//         session.metadata = {
//           ...session.metadata,
//           sessionDuration: duration,
//         };
//       }
//     }

//     await this.ussdSessionRepository.save(session);
//   }

//   // ==================== USER IDENTIFICATION ====================
//   private async identifyUser(
//     session: UssdSession, 
//     phoneNumber: string
//   ): Promise<void> {
//     try {
//       // Try to find user by phone
//       const user = await this.usersService.findByPhone(phoneNumber);
      
//       if (user) {
//         session.userType = user.userType as UserType;
//         session.data.userId = user.id;

//         // Find specific user details based on type
//         switch (user.userType) {
//           case UserType.BENEFICIARY:
//             await this.identifyBeneficiary(session, user.id);
//             break;
            
//           case UserType.ADMIN:
//             await this.identifyStaff(session, user.id);
//             break;
            
//           case UserType.DONOR:
//             await this.identifyDonor(session, user.id);
//             break;
//         }
//       }
//     } catch (error) {
//       this.logger.error(`Error identifying user for phone ${phoneNumber}:`, error);
//     }
//   }

//   private async identifyBeneficiary(session: UssdSession, userId: string): Promise<void> {
//     try {
//       const beneficiary = await this.beneficiariesService.findByUserId(userId);
//       if (beneficiary) {
//         session.data.beneficiaryId = beneficiary.id;
        
//         // Store beneficiary info in session data
//         session.data.selectedOptions = {
//           ...session.data.selectedOptions,
//           beneficiaryStatus: beneficiary.status,
//           beneficiaryName: beneficiary.fullName,
//           programId: beneficiary.programId,
//           currentCapital: beneficiary.currentCapital,
//           joinDate: beneficiary.joinDate,
//         };
        
//         // Check if beneficiary is active
//         if (beneficiary.status !== BeneficiaryStatus.ACTIVE) {
//           session.data.selectedOptions.isActive = false;
//         }
//       }
//     } catch (error) {
//       this.logger.error('Error identifying beneficiary:', error);
//     }
//   }

//   private async identifyStaff(session: UssdSession, userId: string): Promise<void> {
//     try {
//       const staff = await this.staffService.findByUserId(userId);
//       if (staff) {
//         session.data.staffId = staff.id;
//         session.data.staffData = {
//           role: staff.role as StaffRole,
//           assignedTasks: [],
//         };
        
//         // Get assigned tasks for staff
//         const tasks = await this.staffService.getStaffTasks(staff.id);
//         session.data.staffData.assignedTasks = tasks.map(task => ({
//           taskId: task.id,
//           taskName: task.title,
//           status: task.status as TaskStatus,
//           dueDate: task.dueDate,
//         }));
        
//         // Get assigned beneficiaries for tracking
//         const assignedBeneficiaries = await this.staffService.getAssignedBeneficiaries(staff.id);
//         session.data.staffData.beneficiariesToTrack = assignedBeneficiaries.map(b => b.id);
//       }
//     } catch (error) {
//       this.logger.error('Error identifying staff:', error);
//     }
//   }

//   private async identifyDonor(session: UssdSession, userId: string): Promise<void> {
//     try {
//       const donor = await this.donationsService.findDonorByUserId(userId);
//       if (donor) {
//         session.data.donorId = donor.id;
//         session.data.donationData = {
//           ...session.data.donationData,
//           donorName: donor.fullName,
//           donorPhone: donor.phone,
//           currency: donor.preferredCurrency as Currency || Currency.RWF,
//         };
//       }
//     } catch (error) {
//       this.logger.error('Error identifying donor:', error);
//     }
//   }

//   // ==================== USSD FLOW PROCESSING ====================
//   private async processUssdFlow(
//     session: UssdSession, 
//     input?: string
//   ): Promise<string> {
//     const isFirstRequest = !input || input.trim() === '';
    
//     // Store previous menu before processing
//     if (!isFirstRequest) {
//       session.data.previousMenu = session.data.currentMenu;
//     }

//     // Get current menu handler
//     const menuHandler = this.getMenuHandler(session.data.currentMenu);
    
//     if (!menuHandler) {
//       return this.getErrorMessage(session.language, 'Menu not found.');
//     }

//     try {
//       return await menuHandler(session, input, isFirstRequest);
//     } catch (error) {
//       this.logger.error(`Error in menu handler ${session.data.currentMenu}:`, error);
//       return this.getErrorMessage(session.language);
//     }
//   }

//   private getMenuHandler(menu: string): Function | null {
//     const handlers = {
//       'main_menu': this.handleMainMenu.bind(this),
//       'beneficiary_menu': this.handleBeneficiaryMenu.bind(this),
//       'weekly_tracking': this.handleWeeklyTracking.bind(this),
//       'goal_tracking': this.handleGoalTracking.bind(this),
//       'goal_update': this.handleGoalUpdate.bind(this),
//       'goal_setting': this.handleGoalSetting.bind(this),
//       'staff_menu': this.handleStaffMenu.bind(this),
//       'staff_tracking': this.handleStaffTracking.bind(this),
//       'staff_attendance': this.handleStaffAttendance.bind(this),
//       'donation_menu': this.handleDonationMenu.bind(this),
//       'donation_amount': this.handleDonationAmount.bind(this),
//       'donation_payment': this.handleDonationPayment.bind(this),
//       'emergency_menu': this.handleEmergencyMenu.bind(this),
//       'emergency_alert': this.handleEmergencyAlert.bind(this),
//       'program_info': this.handleProgramInfo.bind(this),
//       'support_request': this.handleSupportRequest.bind(this),
//       'beneficiary_info': this.handleBeneficiaryInfo.bind(this),
//       'language_selection': this.handleLanguageSelection.bind(this),
//     };

//     return handlers[menu] || null;
//   }

//   // ==================== MENU HANDLERS ====================
//   private async handleMainMenu(
//     session: UssdSession, 
//     input: string | undefined, 
//     isFirstRequest: boolean
//   ): Promise<string> {
//     if (isFirstRequest) {
//       // Check if language needs to be selected
//       if (!session.language) {
//         session.data.currentMenu = 'language_selection';
//         return this.getLanguageSelectionMenu();
//       }
//       return this.getMainMenu(session.language, session.userType);
//     }

//     switch (input) {
//       case '1': // Beneficiary Services
//         if (session.userType === UserType.BENEFICIARY && session.data.beneficiaryId) {
//           session.data.currentMenu = 'beneficiary_menu';
//           return this.getBeneficiaryMenu(session.language);
//         } else {
//           return this.getAccessDeniedMessage(session.language);
//         }
      
//       case '2': // Staff Services
//         if (session.userType === UserType.ADMIN && session.data.staffId) {
//           session.data.currentMenu = 'staff_menu';
//           return this.getStaffMenu(session.language, session.data.staffData?.role);
//         } else {
//           return this.getAccessDeniedMessage(session.language);
//         }
      
//       case '3': // Donate Now (Open to all)
//         session.data.currentMenu = 'donation_menu';
//         return this.getDonationMenu(session.language);
      
//       case '4': // Program Information
//         session.data.currentMenu = 'program_info';
//         return await this.getProgramInformation(session);
      
//       case '5': // Emergency Contact
//         session.data.currentMenu = 'emergency_menu';
//         return this.getEmergencyMenu(session.language);
      
//       case '6': // Language Change
//         session.data.currentMenu = 'language_selection';
//         return this.getLanguageSelectionMenu();
      
//       case '0': // Exit
//         return this.getExitMessage(session.language);
      
//       default:
//         return this.getInvalidOptionMessage(session.language);
//     }
//   }

//   private async handleBeneficiaryMenu(
//     session: UssdSession, 
//     input: string
//   ): Promise<string> {
//     if (!session.data.beneficiaryId) {
//       return this.getErrorMessage(
//         session.language, 
//         'You need to be a registered beneficiary to access this service.'
//       );
//     }

//     // Check beneficiary status
//     const beneficiary = await this.beneficiariesService.findById(
//       session.data.beneficiaryId
//     );
    
//     if (!beneficiary) {
//       return this.getErrorMessage(session.language, 'Beneficiary not found.');
//     }

//     if (beneficiary.status !== BeneficiaryStatus.ACTIVE) {
//       return this.getErrorMessage(
//         session.language,
//         `Your account status is: ${beneficiary.status}. Please contact support.`
//       );
//     }

//     switch (input) {
//       case '1': // Weekly Tracking
//         session.data.currentMenu = 'weekly_tracking';
//         session.data.trackingData = {
//           attendance: AttendanceStatus.PRESENT, // Default
//           submissionDate: new Date(),
//         };
//         session.data.trackingStep = 1;
//         return this.getWeeklyTrackingQuestion(session.language, 1);
      
//       case '2': // Goal Progress
//         session.data.currentMenu = 'goal_tracking';
//         return await this.getGoalProgress(session);
      
//       case '3': // View My Info
//         session.data.currentMenu = 'beneficiary_info';
//         return await this.getBeneficiaryInfo(session);
      
//       case '4': // Request Support
//         session.data.currentMenu = 'support_request';
//         return this.getSupportRequestPrompt(session.language);
      
//       case '5': // View Program Details
//         return await this.getProgramDetails(session);
      
//       case '0': // Back to Main Menu
//         session.data.currentMenu = 'main_menu';
//         return this.getMainMenu(session.language, session.userType);
      
//       default:
//         return this.getInvalidOptionMessage(session.language);
//     }
//   }

//   private async handleWeeklyTracking(
//     session: UssdSession, 
//     input: string
//   ): Promise<string> {
//     const step = session.data.trackingStep || 1;
    
//     if (!session.data.trackingData) {
//       session.data.trackingData = {};
//     }

//     // Validate and store response based on step
//     switch (step) {
//       case 1: // Income
//         const income = this.parseAmount(input, session.language);
//         if (income === null) {
//           return this.getInvalidInputMessage(session.language, 'income');
//         }
//         session.data.trackingData.incomeThisWeek = income;
//         break;
      
//       case 2: // Expenses
//         const expenses = this.parseAmount(input, session.language);
//         if (expenses === null) {
//           return this.getInvalidInputMessage(session.language, 'expenses');
//         }
//         session.data.trackingData.expensesThisWeek = expenses;
//         break;
      
//       case 3: // Current Capital
//         const capital = this.parseAmount(input, session.language);
//         if (capital === null) {
//           return this.getInvalidInputMessage(session.language, 'capital');
//         }
//         session.data.trackingData.currentCapital = capital;
//         break;
      
//       case 4: // Attendance
//         const attendance = this.mapAttendance(input, session.language);
//         if (!attendance) {
//           return this.getInvalidOptionMessage(session.language);
//         }
//         session.data.trackingData.attendance = attendance;
//         break;
      
//       case 5: // Challenges
//         if (input.length > 500) {
//           return this.getErrorMessage(session.language, 'Response too long. Max 500 characters.');
//         }
//         session.data.trackingData.challenges = input;
//         break;
      
//       case 6: // Solutions
//         if (input.length > 500) {
//           return this.getErrorMessage(session.language, 'Response too long. Max 500 characters.');
//         }
//         session.data.trackingData.solutionsImplemented = input;
        
//         // Submit tracking data
//         const success = await this.submitWeeklyTracking(session);
        
//         if (success) {
//           // Return to beneficiary menu
//           session.data.currentMenu = 'beneficiary_menu';
//           delete session.data.trackingStep;
//           delete session.data.trackingData;
          
//           return this.getSuccessMessage(
//             session.language, 
//             'Weekly tracking submitted successfully! You will receive an SMS confirmation.'
//           );
//         } else {
//           return this.getErrorMessage(
//             session.language, 
//             'Failed to submit tracking. Please try again or contact support.'
//           );
//         }
//     }

//     // Move to next step
//     session.data.trackingStep = step + 1;
    
//     if (step + 1 <= 6) {
//       return this.getWeeklyTrackingQuestion(session.language, step + 1);
//     } else {
//       return this.getErrorMessage(session.language);
//     }
//   }

//   private async submitWeeklyTracking(session: UssdSession): Promise<boolean> {
//     try {
//       if (!session.data.beneficiaryId || !session.data.trackingData) {
//         return false;
//       }

//       const trackingData = {
//         beneficiaryId: session.data.beneficiaryId,
//         weekEnding: new Date(),
//         attendance: session.data.trackingData.attendance || AttendanceStatus.PRESENT,
//         incomeThisWeek: session.data.trackingData.incomeThisWeek || 0,
//         expensesThisWeek: session.data.trackingData.expensesThisWeek || 0,
//         currentCapital: session.data.trackingData.currentCapital || 0,
//         challenges: session.data.trackingData.challenges || '',
//         solutionsImplemented: session.data.trackingData.solutionsImplemented || '',
//         submittedBy: session.data.staffId || null,
//         isOfflineSync: true,
//         syncSessionId: session.sessionId,
//         metadata: {
//           submittedVia: 'USSD',
//           language: session.language,
//           phoneNumber: session.phoneNumber,
//           sessionId: session.sessionId,
//         },
//       };

//       const createdTracking = await this.weeklyTrackingService.create(trackingData);
      
//       if (createdTracking) {
//         // Update beneficiary's current capital
//         await this.beneficiariesService.updateCapital(
//           session.data.beneficiaryId,
//           trackingData.currentCapital
//         );
        
//         // Send confirmation notification
//         await this.notificationService.sendNotification({
//           userId: session.data.userId,
//           type: NotificationType.TRACKING_REMINDER,
//           channel: NotificationChannel.SMS,
//           status: NotificationStatus.PENDING,
//           title: this.getTranslation(session.language, 'tracking_submitted_title'),
//           message: this.getTranslation(session.language, 'tracking_submitted_message'),
//           metadata: {
//             sessionId: session.sessionId,
//             beneficiaryId: session.data.beneficiaryId,
//             trackingId: createdTracking.id,
//             weekEnding: trackingData.weekEnding,
//           },
//         });
        
//         return true;
//       }
      
//       return false;
//     } catch (error) {
//       this.logger.error('Error submitting weekly tracking:', error);
//       return false;
//     }
//   }

//   // ==================== GOAL HANDLERS ====================
//   private async handleGoalTracking(
//     session: UssdSession, 
//     input: string
//   ): Promise<string> {
//     try {
//       if (!session.data.beneficiaryId) {
//         return this.getErrorMessage(session.language, 'Beneficiary not found.');
//       }

//       // Get beneficiary goals
//       const goals = await this.goalsService.getBeneficiaryGoals(session.data.beneficiaryId);
      
//       if (goals.length === 0) {
//         const messages = {
//           [Language.EN]: 'No goals set yet.\n\n1. Set New Goal\n0. Back',
//           [Language.RW]: 'Nta ntego zahashyizweho.\n\n1. Shyiraho Intego Nshya\n0. Subira'
//         };
        
//         session.data.currentMenu = 'goal_setting';
//         session.data.goalData = {
//           goalStatus: GoalStatus.NOT_STARTED,
//         };
//         session.data.selectedOptions.goalStep = 1;
        
//         return `CON ${messages[session.language]}`;
//       }

//       // Display goals
//       let response = this.getTranslation(session.language, 'goals_progress') + '\n\n';
      
//       goals.slice(0, 3).forEach((goal, index) => {
//         const progress = goal.targetAmount > 0 
//           ? ((goal.currentProgress / goal.targetAmount) * 100).toFixed(1)
//           : '0.0';
//         const status = goal.status || GoalStatus.IN_PROGRESS;
        
//         response += `${index + 1}. ${goal.description}\n`;
//         response += `   ${this.getTranslation(session.language, 'progress')}: ${progress}%\n`;
//         response += `   ${this.getTranslation(session.language, 'status')}: ${status}\n\n`;
//       });

//       response += this.getTranslation(session.language, 'select_goal_update') + '\n0. ' + 
//                   this.getTranslation(session.language, 'back');
      
//       session.data.goals = goals;
//       return `CON ${response}`;
//     } catch (error) {
//       this.logger.error('Error in goal tracking:', error);
//       return this.getErrorMessage(session.language);
//     }
//   }

//   private async handleGoalUpdate(
//     session: UssdSession, 
//     input: string
//   ): Promise<string> {
//     if (input === '0') {
//       session.data.currentMenu = 'beneficiary_menu';
//       return this.getBeneficiaryMenu(session.language);
//     }

//     const goalIndex = parseInt(input) - 1;
//     const goals = session.data.goals;

//     if (goals && goals[goalIndex]) {
//       const goal = goals[goalIndex];
//       session.data.selectedOptions.selectedGoalId = goal.id;
//       session.data.currentMenu = 'goal_update_step';
//       session.data.selectedOptions.goalUpdateStep = 1;
      
//       const messages = {
//         [Language.EN]: `Goal: ${goal.description}\nTarget: ${goal.targetAmount} ${goal.currency}\nCurrent: ${goal.currentProgress} ${goal.currency}\n\nEnter new progress amount:`,
//         [Language.RW]: `Intego: ${goal.description}\nIntego: ${goal.targetAmount} ${goal.currency}\nUbu: ${goal.currentProgress} ${goal.currency}\n\nAndika umubare mushya w'iterambere:`
//       };
      
//       return `CON ${messages[session.language]}`;
//     }

//     return this.getInvalidOptionMessage(session.language);
//   }

//   private async handleGoalSetting(
//     session: UssdSession, 
//     input: string
//   ): Promise<string> {
//     const step = session.data.selectedOptions?.goalStep || 1;

//     if (input === '0' && step === 1) {
//       session.data.currentMenu = 'beneficiary_menu';
//       return this.getBeneficiaryMenu(session.language);
//     }

//     if (!session.data.goalData) {
//       session.data.goalData = {};
//     }

//     switch (step) {
//       case 1: // Goal description
//         if (input.length < 5 || input.length > 200) {
//           return this.getErrorMessage(
//             session.language,
//             'Goal description must be between 5 and 200 characters.'
//           );
//         }
//         session.data.goalData.description = input;
//         break;
      
//       case 2: // Goal type
//         const goalType = this.mapGoalType(input);
//         if (!goalType) {
//           return this.getInvalidOptionMessage(session.language);
//         }
//         session.data.goalData.goalType = goalType;
//         break;
      
//       case 3: // Target amount
//         const amount = this.parseAmount(input, session.language);
//         if (amount === null || amount <= 0) {
//           return this.getInvalidInputMessage(session.language, 'target_amount');
//         }
//         session.data.goalData.targetAmount = amount;
//         break;
      
//       case 4: // Target date (optional)
//         if (input && input !== '0') {
//           const targetDate = this.parseDate(input);
//           if (!targetDate) {
//             return this.getInvalidInputMessage(session.language, 'date_format');
//           }
//           session.data.goalData.targetDate = targetDate;
//         }
        
//         // Create the goal
//         const success = await this.createGoal(session);
        
//         if (success) {
//           session.data.currentMenu = 'beneficiary_menu';
//           delete session.data.selectedOptions.goalStep;
//           delete session.data.goalData;
          
//           return this.getSuccessMessage(
//             session.language, 
//             'Goal created successfully!'
//           );
//         } else {
//           return this.getErrorMessage(
//             session.language, 
//             'Failed to create goal. Please try again.'
//           );
//         }
//     }

//     // Move to next step
//     session.data.selectedOptions.goalStep = step + 1;
    
//     if (step + 1 <= 4) {
//       return this.getGoalSettingQuestion(session.language, step + 1);
//     } else {
//       return this.getErrorMessage(session.language);
//     }
//   }

//   private async createGoal(session: UssdSession): Promise<boolean> {
//     try {
//       if (!session.data.beneficiaryId || !session.data.goalData) {
//         return false;
//       }

//       const goalData = {
//         beneficiaryId: session.data.beneficiaryId,
//         description: session.data.goalData.description,
//         goalType: session.data.goalData.goalType || GoalType.FINANCIAL,
//         targetAmount: session.data.goalData.targetAmount || 0,
//         currentProgress: 0,
//         currency: Currency.RWF,
//         status: GoalStatus.NOT_STARTED,
//         startDate: new Date(),
//         targetDate: session.data.goalData.targetDate || null,
//         createdBy: session.data.userId,
//         metadata: {
//           createdVia: 'USSD',
//           sessionId: session.sessionId,
//         },
//       };

//       const createdGoal = await this.goalsService.create(goalData);
//       return !!createdGoal;
//     } catch (error) {
//       this.logger.error('Error creating goal:', error);
//       return false;
//     }
//   }

//   // ==================== STAFF HANDLERS ====================
//   private async handleStaffMenu(
//     session: UssdSession, 
//     input: string
//   ): Promise<string> {
//     // Check staff role for access control
//     const staffRole = session.data.staffData?.role;
    
//     if (!staffRole) {
//       return this.getAccessDeniedMessage(session.language);
//     }

//     switch (input) {
//       case '1': // Beneficiary Tracking
//         if (![StaffRole.ADMIN, StaffRole.PROGRAM_MANAGER, StaffRole.DATA_ENTRY].includes(staffRole)) {
//           return this.getAccessDeniedMessage(session.language);
//         }
//         session.data.currentMenu = 'staff_tracking';
//         return await this.getStaffTrackingMenu(session);
      
//       case '2': // Attendance Marking
//         if (![StaffRole.ADMIN, StaffRole.PROGRAM_MANAGER, StaffRole.DATA_ENTRY].includes(staffRole)) {
//           return this.getAccessDeniedMessage(session.language);
//         }
//         session.data.currentMenu = 'staff_attendance';
//         return await this.getStaffAttendanceMenu(session);
      
//       case '3': // Data Synchronization
//         return await this.handleDataSync(session);
      
//       case '4': // Task Assignment
//         return await this.handleTaskAssignment(session);
      
//       case '5': // View Reports
//         return await this.handleViewReports(session);
      
//       case '0': // Back to Main Menu
//         session.data.currentMenu = 'main_menu';
//         return this.getMainMenu(session.language, session.userType);
      
//       default:
//         return this.getInvalidOptionMessage(session.language);
//     }
//   }

//   private async handleStaffTracking(
//     session: UssdSession, 
//     input: string
//   ): Promise<string> {
//     // Implementation for staff tracking beneficiaries
//     // Similar pattern to beneficiary tracking but for multiple beneficiaries
//     return this.getComingSoonMessage(session.language);
//   }

//   private async handleStaffAttendance(
//     session: UssdSession, 
//     input: string
//   ): Promise<string> {
//     // Implementation for staff marking attendance
//     return this.getComingSoonMessage(session.language);
//   }

//   // ==================== DONATION HANDLERS ====================
//   private async handleDonationMenu(
//     session: UssdSession, 
//     input: string
//   ): Promise<string> {
//     switch (input) {
//       case '1': // 1,000 RWF
//         session.data.donationData = {
//           amount: 1000,
//           currency: Currency.RWF,
//           paymentMethod: PaymentMethod.MOBILE_MONEY,
//           paymentStatus: PaymentStatus.PENDING,
//         };
//         session.data.currentMenu = 'donation_payment';
//         return this.getPaymentConfirmation(session);
      
//       case '2': // 5,000 RWF
//         session.data.donationData = {
//           amount: 5000,
//           currency: Currency.RWF,
//           paymentMethod: PaymentMethod.MOBILE_MONEY,
//           paymentStatus: PaymentStatus.PENDING,
//         };
//         session.data.currentMenu = 'donation_payment';
//         return this.getPaymentConfirmation(session);
      
//       case '3': // 10,000 RWF
//         session.data.donationData = {
//           amount: 10000,
//           currency: Currency.RWF,
//           paymentMethod: PaymentMethod.MOBILE_MONEY,
//           paymentStatus: PaymentStatus.PENDING,
//         };
//         session.data.currentMenu = 'donation_payment';
//         return this.getPaymentConfirmation(session);
      
//       case '4': // Other Amount
//         session.data.currentMenu = 'donation_amount';
//         return this.getDonationAmountPrompt(session.language);
      
//       case '5': // Recurring Donation
//         return await this.handleRecurringDonation(session);
      
//       case '0': // Back
//         session.data.currentMenu = 'main_menu';
//         return this.getMainMenu(session.language, session.userType);
      
//       default:
//         return this.getInvalidOptionMessage(session.language);
//     }
//   }

//   private async handleDonationAmount(
//     session: UssdSession, 
//     input: string
//   ): Promise<string> {
//     const amount = this.parseAmount(input, session.language);
    
//     if (amount === null || amount < 100) {
//       return this.getErrorMessage(
//         session.language, 
//         'Minimum donation is 100 RWF. Please enter a valid amount.'
//       );
//     }

//     if (amount > 1000000) {
//       return this.getErrorMessage(
//         session.language, 
//         'Maximum donation is 1,000,000 RWF. Please enter a smaller amount.'
//       );
//     }

//     session.data.donationData = {
//       amount,
//       currency: Currency.RWF,
//       paymentMethod: PaymentMethod.MOBILE_MONEY,
//       paymentStatus: PaymentStatus.PENDING,
//     };
    
//     session.data.currentMenu = 'donation_payment';
//     return this.getPaymentConfirmation(session);
//   }

//   private async handleDonationPayment(
//     session: UssdSession, 
//     input: string
//   ): Promise<string> {
//     if (input === '1') { // Confirm
//       const success = await this.processDonation(session);
      
//       if (success) {
//         session.data.currentMenu = 'main_menu';
//         delete session.data.donationData;
        
//         return this.getSuccessMessage(
//           session.language,
//           'Donation successful! Thank you for your support. You will receive a receipt via SMS.'
//         );
//       } else {
//         return this.getErrorMessage(
//           session.language,
//           'Payment failed. Please try again or contact support.'
//         );
//       }
//     } else if (input === '2') { // Cancel
//       session.data.currentMenu = 'donation_menu';
//       return this.getDonationMenu(session.language);
//     } else {
//       return this.getInvalidOptionMessage(session.language);
//     }
//   }

//   private async processDonation(session: UssdSession): Promise<boolean> {
//     try {
//       if (!session.data.donationData) {
//         return false;
//       }

//       const donationData = {
//         amount: session.data.donationData.amount,
//         currency: session.data.donationData.currency || Currency.RWF,
//         paymentMethod: session.data.donationData.paymentMethod || PaymentMethod.MOBILE_MONEY,
//         status: PaymentStatus.PENDING,
//         donorName: session.data.donationData.donorName || 'Anonymous',
//         donorPhone: session.data.donationData.donorPhone || session.phoneNumber,
//         donorEmail: null,
//         donationType: DonationType.ONE_TIME,
//         isRecurring: false,
//         metadata: {
//           submittedVia: 'USSD',
//           sessionId: session.sessionId,
//           phoneNumber: session.phoneNumber,
//           language: session.language,
//         },
//       };

//       // Process payment through Africa's Talking or other payment gateway
//       const paymentResult = await this.processMobileMoneyPayment(
//         session.phoneNumber,
//         donationData.amount,
//         'LCEO Donation'
//       );

//       if (paymentResult.success) {
//         donationData.status = PaymentStatus.COMPLETED;
//         donationData.metadata.transactionId = paymentResult.transactionId;
        
//         const createdDonation = await this.donationsService.create(donationData);
        
//         if (createdDonation) {
//           // Send receipt
//           await this.notificationService.sendNotification({
//             userId: session.data.userId,
//             type: NotificationType.DONATION_RECEIPT,
//             channel: NotificationChannel.SMS,
//             status: NotificationStatus.PENDING,
//             title: this.getTranslation(session.language, 'donation_receipt_title'),
//             message: this.getDonationReceiptMessage(session, createdDonation),
//             metadata: {
//               donationId: createdDonation.id,
//               amount: donationData.amount,
//               currency: donationData.currency,
//               transactionId: paymentResult.transactionId,
//             },
//           });
          
//           return true;
//         }
//       }
      
//       return false;
//     } catch (error) {
//       this.logger.error('Error processing donation:', error);
//       return false;
//     }
//   }

//   private async processMobileMoneyPayment(
//     phoneNumber: string,
//     amount: number,
//     description: string
//   ): Promise<{ success: boolean; transactionId?: string; message?: string }> {
//     // Implement actual mobile money payment processing
//     // This is a mock implementation
//     return {
//       success: true,
//       transactionId: `MM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//       message: 'Payment initiated successfully',
//     };
//   }

//   // ==================== EMERGENCY HANDLERS ====================
//   private async handleEmergencyMenu(
//     session: UssdSession, 
//     input: string
//   ): Promise<string> {
//     switch (input) {
//       case '1': // Call Emergency Contact
//         return this.getEmergencyContactInfo(session);
      
//       case '2': // Send Emergency Alert
//         session.data.currentMenu = 'emergency_alert';
//         return this.getEmergencyAlertPrompt(session.language);
      
//       case '3': // View Emergency Info
//         return await this.getEmergencyInfo(session);
      
//       case '0': // Back
//         session.data.currentMenu = 'main_menu';
//         return this.getMainMenu(session.language, session.userType);
      
//       default:
//         return this.getInvalidOptionMessage(session.language);
//     }
//   }

//   private async handleEmergencyAlert(
//     session: UssdSession, 
//     input: string
//   ): Promise<string> {
//     if (input.length < 5) {
//       return this.getErrorMessage(
//         session.language,
//         'Please provide more details about the emergency (minimum 5 characters).'
//       );
//     }

//     const success = await this.sendEmergencyAlert(session, input);
    
//     if (success) {
//       session.data.currentMenu = 'main_menu';
//       return this.getSuccessMessage(
//         session.language,
//         'Emergency alert sent! Our team will contact you shortly.'
//       );
//     } else {
//       return this.getErrorMessage(
//         session.language,
//         'Failed to send emergency alert. Please try again or call directly.'
//       );
//     }
//   }

//   private async sendEmergencyAlert(
//     session: UssdSession, 
//     message: string
//   ): Promise<boolean> {
//     try {
//       // Get emergency contacts from configuration or database
//       const emergencyContacts = await this.getEmergencyContacts();
      
//       // Send SMS alerts to emergency contacts
//       for (const contact of emergencyContacts) {
//         await this.notificationService.sendNotification({
//           userId: null,
//           type: NotificationType.SYSTEM_ALERT,
//           channel: NotificationChannel.SMS,
//           status: NotificationStatus.PENDING,
//           title: 'EMERGENCY ALERT - LCEO',
//           message: `Emergency from ${session.phoneNumber}: ${message}\nTime: ${new Date().toISOString()}`,
//           metadata: {
//             emergency: true,
//             senderPhone: session.phoneNumber,
//             alertTime: new Date(),
//           },
//         });
//       }
      
//       // Also send to the user as confirmation
//       await this.notificationService.sendNotification({
//         userId: session.data.userId,
//         type: NotificationType.SYSTEM_ALERT,
//         channel: NotificationChannel.SMS,
//         status: NotificationStatus.PENDING,
//         title: this.getTranslation(session.language, 'emergency_alert_sent_title'),
//         message: this.getTranslation(session.language, 'emergency_alert_sent_message'),
//         metadata: {
//           emergency: true,
//           sentTo: emergencyContacts.map(c => c.phone),
//         },
//       });
      
//       return true;
//     } catch (error) {
//       this.logger.error('Error sending emergency alert:', error);
//       return false;
//     }
//   }

//   // ==================== SUPPORT METHODS ====================
//   private async getBeneficiaryInfo(session: UssdSession): Promise<string> {
//     try {
//       if (!session.data.beneficiaryId) {
//         return this.getErrorMessage(session.language, 'Beneficiary not found');
//       }

//       const beneficiary = await this.beneficiariesService.findById(session.data.beneficiaryId);
      
//       if (!beneficiary) {
//         return this.getErrorMessage(session.language, 'Beneficiary not found');
//       }

//       // Get program details
//       let programInfo = 'N/A';
//       if (beneficiary.programId) {
//         const program = await this.programsService.findById(beneficiary.programId);
//         if (program) {
//           programInfo = program.name?.[session.language] || program.name?.en || 'N/A';
//         }
//       }

//       const messages = {
//         [Language.EN]: `Your Information:\n\nName: ${beneficiary.fullName}\nStatus: ${beneficiary.status}\nProgram: ${programInfo}\nCapital: ${beneficiary.currentCapital} RWF\nJoin Date: ${moment(beneficiary.joinDate).format('YYYY-MM-DD')}\n\n0. Back`,
//         [Language.RW]: `Amakuru yawe:\n\nIzina: ${beneficiary.fullName}\nImimerere: ${beneficiary.status}\nIngamba: ${programInfo}\nIfaranga: ${beneficiary.currentCapital} RWF\nItariki y'iyandikisha: ${moment(beneficiary.joinDate).format('YYYY-MM-DD')}\n\n0. Subira`
//       };

//       return `CON ${messages[session.language]}`;
//     } catch (error) {
//       this.logger.error('Error getting beneficiary info:', error);
//       return this.getErrorMessage(session.language);
//     }
//   }

//   private async getProgramDetails(session: UssdSession): Promise<string> {
//     try {
//       if (!session.data.beneficiaryId) {
//         return this.getErrorMessage(session.language, 'Beneficiary not found');
//       }

//       const beneficiary = await this.beneficiariesService.findById(session.data.beneficiaryId);
      
//       if (!beneficiary?.programId) {
//         return this.getErrorMessage(session.language, 'No program assigned');
//       }

//       const program = await this.programsService.findById(beneficiary.programId);
      
//       if (!program) {
//         return this.getErrorMessage(session.language, 'Program not found');
//       }

//       const startDate = moment(program.startDate).format('YYYY-MM-DD');
//       const endDate = program.endDate ? moment(program.endDate).format('YYYY-MM-DD') : 'Ongoing';
      
//       const messages = {
//         [Language.EN]: `Program: ${program.name?.en || 'N/A'}\nDescription: ${program.description?.en || 'N/A'}\nStatus: ${program.status}\nCategory: ${program.category}\nStart: ${startDate}\nEnd: ${endDate}\n\n0. Back`,
//         [Language.RW]: `Ingamba: ${program.name?.rw || 'N/A'}\nIbisobanuro: ${program.description?.rw || 'N/A'}\nImimerere: ${program.status}\nIcyiciro: ${program.category}\nItangiriro: ${startDate}\nIherezo: ${endDate}\n\n0. Subira`
//       };

//       return `CON ${messages[session.language]}`;
//     } catch (error) {
//       this.logger.error('Error getting program details:', error);
//       return this.getErrorMessage(session.language);
//     }
//   }

//   private async getProgramInformation(session: UssdSession): Promise<string> {
//     try {
//       const programs = await this.programsService.findAllActive();
      
//       if (programs.length === 0) {
//         return this.getErrorMessage(session.language, 'No active programs available.');
//       }

//       let response = this.getTranslation(session.language, 'lceo_programs') + ':\n\n';
      
//       programs.slice(0, 5).forEach((program, index) => {
//         const programName = program.name?.[session.language] || program.name?.en || 'Unnamed Program';
//         response += `${index + 1}. ${programName}\n`;
//       });

//       response += `\n${this.getTranslation(session.language, 'select_program_details')}\n`;
//       response += `0. ${this.getTranslation(session.language, 'back')}`;
      
//       session.data.selectedOptions.programs = programs;
//       return `CON ${response}`;
//     } catch (error) {
//       this.logger.error('Error getting program information:', error);
//       return this.getErrorMessage(session.language);
//     }
//   }

//   private async handleProgramInfo(
//     session: UssdSession, 
//     input: string
//   ): Promise<string> {
//     if (input === '0') {
//       session.data.currentMenu = 'main_menu';
//       return this.getMainMenu(session.language, session.userType);
//     }

//     const programIndex = parseInt(input) - 1;
//     const programs = session.data.selectedOptions?.programs;

//     if (programs && programs[programIndex]) {
//       const program = programs[programIndex];
//       const startDate = moment(program.startDate).format('YYYY-MM-DD');
//       const endDate = program.endDate ? moment(program.endDate).format('YYYY-MM-DD') : 'Ongoing';
      
//       const messages = {
//         [Language.EN]: `${program.name?.en || 'Program'}\n\n${program.description?.en || 'No description available.'}\n\nStatus: ${program.status}\nCategory: ${program.category}\nStart: ${startDate}\nEnd: ${endDate}\n\n0. Back`,
//         [Language.RW]: `${program.name?.rw || 'Ingamba'}\n\n${program.description?.rw || 'Nta bisobanuro bihari.'}\n\nImimerere: ${program.status}\nIcyiciro: ${program.category}\nItangiriro: ${startDate}\nIherezo: ${endDate}\n\n0. Subira`
//       };

//       return `CON ${messages[session.language]}`;
//     }

//     return this.getInvalidOptionMessage(session.language);
//   }

//   private async handleSupportRequest(
//     session: UssdSession, 
//     input: string
//   ): Promise<string> {
//     if (input && input !== '0') {
//       // Submit support request
//       const success = await this.submitSupportRequest(session, input);
      
//       if (success) {
//         session.data.currentMenu = 'beneficiary_menu';
//         return this.getSuccessMessage(
//           session.language,
//           'Support request submitted! Our team will contact you within 24 hours.'
//         );
//       } else {
//         return this.getErrorMessage(
//           session.language,
//           'Failed to submit support request. Please try again.'
//         );
//       }
//     } else if (input === '0') {
//       session.data.currentMenu = 'beneficiary_menu';
//       return this.getBeneficiaryMenu(session.language);
//     } else {
//       // First time - show prompt
//       return this.getSupportRequestPrompt(session.language);
//     }
//   }

//   private async submitSupportRequest(
//     session: UssdSession, 
//     message: string
//   ): Promise<boolean> {
//     try {
//       // Create support ticket
//       const supportData = {
//         beneficiaryId: session.data.beneficiaryId,
//         staffId: session.data.staffId,
//         userId: session.data.userId,
//         phoneNumber: session.phoneNumber,
//         message,
//         priority: 'medium',
//         status: 'open',
//         channel: 'USSD',
//         metadata: {
//           sessionId: session.sessionId,
//           language: session.language,
//         },
//       };

//       // Save to database (you'll need to create a support service)
//       // await this.supportService.create(supportData);
      
//       // Notify support team
//       await this.notificationService.sendNotification({
//         userId: null,
//         type: NotificationType.SYSTEM_ALERT,
//         channel: NotificationChannel.SMS,
//         status: NotificationStatus.PENDING,
//         title: 'New Support Request - LCEO',
//         message: `New support request from ${session.phoneNumber}:\n${message}`,
//         metadata: {
//           supportRequest: true,
//           beneficiaryId: session.data.beneficiaryId,
//           phoneNumber: session.phoneNumber,
//         },
//       });
      
//       return true;
//     } catch (error) {
//       this.logger.error('Error submitting support request:', error);
//       return false;
//     }
//   }

//   private async handleLanguageSelection(
//     session: UssdSession, 
//     input: string
//   ): Promise<string> {
//     switch (input) {
//       case '1':
//         session.language = Language.EN;
//         break;
//       case '2':
//         session.language = Language.RW;
//         break;
//       default:
//         return this.getInvalidOptionMessage(session.language || Language.EN);
//     }

//     // Save language preference
//     if (session.data.userId) {
//       await this.usersService.updateLanguagePreference(
//         session.data.userId, 
//         session.language
//       );
//     }

//     session.data.currentMenu = 'main_menu';
//     return this.getMainMenu(session.language, session.userType);
//   }

//   // ==================== UTILITY METHODS ====================
//   private mapLanguage(lang: string): Language {
//     switch (lang.toLowerCase()) {
//       case 'rw':
//       case 'kin':
//       case 'kinyarwanda':
//         return Language.RW;
//       case 'en':
//       case 'eng':
//       case 'english':
//       default:
//         return Language.EN;
//     }
//   }

//   private mapAttendance(input: string, language: Language): AttendanceStatus | null {
//     switch (input) {
//       case '1':
//         return AttendanceStatus.PRESENT;
//       case '2':
//         return AttendanceStatus.ABSENT;
//       case '3':
//         return AttendanceStatus.LATE;
//       default:
//         return null;
//     }
//   }

//   private mapGoalType(input: string): GoalType | null {
//     switch (input) {
//       case '1':
//         return GoalType.FINANCIAL;
//       case '2':
//         return GoalType.BUSINESS;
//       case '3':
//         return GoalType.EDUCATION;
//       case '4':
//         return GoalType.PERSONAL;
//       case '5':
//         return GoalType.SKILLS;
//       default:
//         return null;
//     }
//   }

//   private parseAmount(input: string, language: Language): number | null {
//     const amount = parseFloat(input.replace(/[^\d.]/g, ''));
//     return isNaN(amount) ? null : amount;
//   }

//   private parseDate(input: string): Date | null {
//     try {
//       const date = moment(input, 'YYYY-MM-DD');
//       return date.isValid() ? date.toDate() : null;
//     } catch {
//       return null;
//     }
//   }

//   private isValidServiceCode(serviceCode: string): boolean {
//     // Validate service code format
//     const validCodes = ['*384*', '*123*', '*456*']; // Add your actual service codes
//     return validCodes.some(code => serviceCode.startsWith(code));
//   }

//   private formatPhoneNumber(phone: string): string {
//     const digits = phone.replace(/\D/g, '');
    
//     if (digits.startsWith('250')) {
//       return `+${digits}`;
//     } else if (digits.startsWith('0')) {
//       return `+250${digits.substring(1)}`;
//     } else if (digits.length === 9) {
//       return `+250${digits}`;
//     }
    
//     return `+${digits}`;
//   }

//   private getTranslation(language: Language, key: string): string {
//     const translations = {
//       [Language.EN]: {
//         tracking_submitted_title: 'Tracking Submitted',
//         tracking_submitted_message: 'Your weekly tracking has been submitted successfully!',
//         goals_progress: 'Goals Progress',
//         progress: 'Progress',
//         status: 'Status',
//         select_goal_update: 'Select goal to update (1-3) or',
//         back: 'Back',
//         lceo_programs: 'LCEO Programs',
//         select_program_details: 'Select program for details',
//         donation_receipt_title: 'Donation Receipt',
//         emergency_alert_sent_title: 'Emergency Alert Sent',
//         emergency_alert_sent_message: 'Your emergency alert has been sent to our team.',
//       },
//       [Language.RW]: {
//         tracking_submitted_title: 'Gukurikirana Byashyizwe',
//         tracking_submitted_message: 'Gukurikirana kwawe icyumweru byashyizwe neza!',
//         goals_progress: 'Iterambere ry\'Intego',
//         progress: 'Iterambere',
//         status: 'Imimerere',
//         select_goal_update: 'Hitamo intego yo kuvugurura (1-3) cyangwa',
//         back: 'Subira',
//         lceo_programs: 'Ingamba za LCEO',
//         select_program_details: 'Hitamo ingamba kugirango ubone ibisobanuro',
//         donation_receipt_title: 'Inyemezabuguzi y\'Ubutanze',
//         emergency_alert_sent_title: 'Itangazo ry\'Urwego Ryerekejwe',
//         emergency_alert_sent_message: 'Itangazo ryawe ry\'urwego ryerekejwe ku itsinda ryacu.',
//       },
//     };

//     return translations[language]?.[key] || key;
//   }

//   private getDonationReceiptMessage(session: UssdSession, donation: any): string {
//     const amount = donation.amount.toLocaleString();
//     const currency = donation.currency;
//     const date = moment(donation.createdAt).format('YYYY-MM-DD HH:mm');
//     const receiptId = donation.id.substring(0, 8).toUpperCase();

//     if (session.language === Language.RW) {
//       return `Murakoze! Ubutanze bwa ${amount} ${currency}. Inyemezabuguzi: ${receiptId}. Itariki: ${date}. Murakoze gufasha LCEO!`;
//     } else {
//       return `Thank you! Donation of ${amount} ${currency}. Receipt: ${receiptId}. Date: ${date}. Thank you for supporting LCEO!`;
//     }
//   }

//   private async getEmergencyContacts(): Promise<Array<{ name: string; phone: string; role: string }>> {
//     // Get emergency contacts from configuration or database
//     return [
//       { name: 'LCEO Emergency', phone: '+250788123456', role: 'Emergency Coordinator' },
//       { name: 'Program Manager', phone: '+250788654321', role: 'Program Manager' },
//       { name: 'Field Officer', phone: '+250788112233', role: 'Field Officer' },
//     ];
//   }

//   // ==================== MENU GENERATION METHODS ====================
//   private getMainMenu(language: Language, userType?: UserType): string {
//     const menus = {
//       [Language.EN]: {
//         title: 'LCEO - Life Changing Endeavor\n',
//         options: [
//           '1. Beneficiary Services',
//           '2. Staff Services',
//           '3. Donate Now',
//           '4. Program Information',
//           '5. Emergency Contact',
//           '6. Change Language',
//           '0. Exit'
//         ]
//       },
//       [Language.RW]: {
//         title: 'LCEO - Gahunda yo Guhindura Ubuzima\n',
//         options: [
//           '1. Serivisi z\'Abakiriya',
//           '2. Serivisi z\'Abakozi',
//           '3. Tanga ubutanze',
//           '4. Amakuru y\'Ingamba',
//           '5. Kuvugana n\'Abafata amezi',
//           '6. Hindura Ururimi',
//           '0. Gusohoka'
//         ]
//       }
//     };

//     const menu = menus[language];
//     let response = menu.title;
    
//     // Filter options based on user type
//     const availableOptions = menu.options.filter(option => {
//       if (userType === UserType.BENEFICIARY) {
//         return !option.includes('Staff Services') && !option.includes('Serivisi z\'Abakozi');
//       }
//       if (userType === UserType.ADMIN) {
//         return true; // Staff see all options
//       }
//       return true;
//     });

//     response += availableOptions.join('\n');
//     response += '\n\n' + this.getTranslation(language, 'enter_option');
    
//     return `CON ${response}`;
//   }

//   private getBeneficiaryMenu(language: Language): string {
//     const menus = {
//       [Language.EN]: {
//         title: 'Beneficiary Services\n',
//         options: [
//           '1. Weekly Tracking',
//           '2. Goal Progress',
//           '3. View My Info',
//           '4. Request Support',
//           '5. View Program Details',
//           '0. Back to Main Menu'
//         ]
//       },
//       [Language.RW]: {
//         title: 'Serivisi z\'Abakiriya\n',
//         options: [
//           '1. Gukurikirana icyumweru',
//           '2. Gukurikirana Intego',
//           '3. Reba Amakuru yanjye',
//           '4. Saba Inkunga',
//           '5. Reba Ibisobanuro by\'Ingamba',
//           '0. Subira ku Menu nyamukuru'
//         ]
//       }
//     };

//     const menu = menus[language];
//     return `CON ${menu.title}${menu.options.join('\n')}\n\n${this.getTranslation(language, 'enter_option')}`;
//   }

//   private getWeeklyTrackingQuestion(language: Language, step: number): string {
//     const questions = {
//       [Language.EN]: {
//         1: 'Enter your income this week (RWF):',
//         2: 'Enter your expenses this week (RWF):',
//         3: 'Enter your current capital (RWF):',
//         4: 'Were you present this week?\n1. Yes\n2. No\n3. Late',
//         5: 'Any challenges faced? (Text reply)',
//         6: 'Solutions implemented? (Text reply)'
//       },
//       [Language.RW]: {
//         1: 'Andika amafaranga y\'inzira wakiriye icyumweru (RWF):',
//         2: 'Andika amafaranga yakoreshejwe icyumweru (RWF):',
//         3: 'Andika amafaranga y\'ikigega ufite ubu (RWF):',
//         4: 'Wari uhagaze icyumweru?\n1. Yego\n2. Oya\n3. Waje nyuma',
//         5: 'Harimo ibibazo? (Andika ibisubizo)',
//         6: 'Ibisubizo byakozwe? (Andika ibisubizo)'
//       }
//     };

//     const question = questions[language][step];
//     return `CON ${question}\n\n${this.getTranslation(language, 'enter_response')}`;
//   }

//   private getGoalSettingQuestion(language: Language, step: number): string {
//     const questions = {
//       [Language.EN]: {
//         1: 'Enter goal description (5-200 characters):',
//         2: 'Select goal type:\n1. Financial\n2. Business\n3. Education\n4. Personal\n5. Skills',
//         3: 'Enter target amount (RWF):',
//         4: 'Enter target date (YYYY-MM-DD) or 0 to skip:'
//       },
//       [Language.RW]: {
//         1: 'Andika ibisobanuro by\'intego (5-200 imibare):',
//         2: 'Hitamo ubwoko bw\'intego:\n1. Ifaranga\n2. Ubucuruzi\n3. Amashuri\n4. Ubwite\n5. Ubuhanga',
//         3: 'Andika umubare w\'intego (RWF):',
//         4: 'Andika itariki y\'intego (YYYY-MM-DD) cyangwa 0 kureka:'
//       }
//     };

//     const question = questions[language][step];
//     return `CON ${question}\n\n${this.getTranslation(language, 'enter_response')}`;
//   }

//   private getStaffMenu(language: Language, role?: StaffRole): string {
//     const baseOptions = {
//       [Language.EN]: [
//         '1. Beneficiary Tracking',
//         '2. Attendance Marking',
//         '3. Data Synchronization',
//         '4. Task Assignment',
//         '5. View Reports',
//         '0. Back to Main Menu'
//       ],
//       [Language.RW]: [
//         '1. Gukurikirana Abakiriya',
//         '2. Gukora Inyandiko y\'Abahagaze',
//         '3. Kubumisha Amakuru',
//         '4. Gushyiraho Imirimo',
//         '5. Reba Raporo',
//         '0. Subira ku Menu nyamukuru'
//       ]
//     };

//     const options = baseOptions[language];
//     const title = language === Language.EN ? 'Staff Services\n' : 'Serivisi z\'Abakozi\n';
    
//     return `CON ${title}${options.join('\n')}\n\n${this.getTranslation(language, 'enter_option')}`;
//   }

//   private getDonationMenu(language: Language): string {
//     const menus = {
//       [Language.EN]: {
//         title: 'Make a Donation\n',
//         options: [
//           '1. 1,000 RWF',
//           '2. 5,000 RWF',
//           '3. 10,000 RWF',
//           '4. Other Amount',
//           '5. Recurring Donation',
//           '0. Back to Main Menu'
//         ]
//       },
//       [Language.RW]: {
//         title: 'Tanga Ubutanze\n',
//         options: [
//           '1. 1,000 RWF',
//           '2. 5,000 RWF',
//           '3. 10,000 RWF',
//           '4. Andika undi mubare',
//           '5. Ubutanze Bwakomeje',
//           '0. Subira ku Menu nyamukuru'
//         ]
//       }
//     };

//     const menu = menus[language];
//     return `CON ${menu.title}${menu.options.join('\n')}\n\n${this.getTranslation(language, 'enter_option')}`;
//   }

//   private getDonationAmountPrompt(language: Language): string {
//     const messages = {
//       [Language.EN]: 'Enter donation amount (RWF, minimum 100):',
//       [Language.RW]: 'Andika umubare w\'ubutanze (RWF, byibuze 100):'
//     };
    
//     return `CON ${messages[language]}\n\n${this.getTranslation(language, 'enter_response')}`;
//   }

//   private getPaymentConfirmation(session: UssdSession): string {
//     const donationData = session.data.donationData;
//     if (!donationData) {
//       return this.getErrorMessage(session.language, 'Donation data not found.');
//     }

//     const amount = donationData.amount?.toLocaleString() || '0';
//     const currency = donationData.currency || Currency.RWF;
//     const method = donationData.paymentMethod === PaymentMethod.MOBILE_MONEY 
//       ? (session.language === Language.EN ? 'Mobile Money' : 'Ifaranga ya Simu')
//       : 'Other';

//     const messages = {
//       [Language.EN]: `Confirm Donation:\n\nAmount: ${amount} ${currency}\nMethod: ${method}\n\n1. Confirm and Pay\n2. Cancel`,
//       [Language.RW]: `Emeza Ubutanze:\n\nUmubare: ${amount} ${currency}\nUburyo: ${method}\n\n1. Emeza kandi Wishyure\n2. Ireke`
//     };

//     return `CON ${messages[session.language]}`;
//   }

//   private getEmergencyMenu(language: Language): string {
//     const menus = {
//       [Language.EN]: {
//         title: 'Emergency Contact\n',
//         options: [
//           '1. Call Emergency Contact',
//           '2. Send Emergency Alert',
//           '3. View Emergency Info',
//           '0. Back to Main Menu'
//         ]
//       },
//       [Language.RW]: {
//         title: 'Kuvugana n\'Abafata Amezi\n',
//         options: [
//           '1. Hamagara Umufata Amezi',
//           '2. Ohereza Itangazo ry\'Urwego',
//           '3. Reba Amakuru y\'Urwego',
//           '0. Subira ku Menu nyamukuru'
//         ]
//       }
//     };

//     const menu = menus[language];
//     return `CON ${menu.title}${menu.options.join('\n')}\n\n${this.getTranslation(language, 'enter_option')}`;
//   }

//   private getEmergencyAlertPrompt(language: Language): string {
//     const messages = {
//       [Language.EN]: 'Describe the emergency (minimum 5 characters):',
//       [Language.RW]: 'Sobanura ikibazo (byibuze imibare 5):'
//     };
    
//     return `CON ${messages[language]}\n\n${this.getTranslation(language, 'enter_response')}`;
//   }

//   private async getEmergencyContactInfo(session: UssdSession): Promise<string> {
//     const contacts = await this.getEmergencyContacts();
    
//     let response = session.language === Language.EN 
//       ? 'Emergency Contacts:\n\n'
//       : 'Abafata Amezi:\n\n';
    
//     contacts.forEach((contact, index) => {
//       response += `${index + 1}. ${contact.name}\n`;
//       response += `   ${contact.phone}\n`;
//       response += `   ${contact.role}\n\n`;
//     });

//     response += session.language === Language.EN 
//       ? 'Please call the appropriate contact.\n\n0. Back'
//       : 'Nyamuneka hamagara umufata amezi ukwiye.\n\n0. Subira';
    
//     return `CON ${response}`;
//   }

//   private async getEmergencyInfo(session: UssdSession): Promise<string> {
//     const contacts = await this.getEmergencyContacts();
//     const mainContact = contacts[0];
    
//     const messages = {
//       [Language.EN]: `Emergency Information:\n\nMain Contact: ${mainContact.name}\nPhone: ${mainContact.phone}\nRole: ${mainContact.role}\n\nFor emergencies, call ${mainContact.phone} or send an alert.\n\n0. Back`,
//       [Language.RW]: `Amakuru y\'Urwego:\n\nUmufata Amezi Nyamukuru: ${mainContact.name}\nTelefone: ${mainContact.phone}\nUmwanya: ${mainContact.role}\n\nMu bihe by\'urwego, hamagara ${mainContact.phone} cyangwa ohereze itangazo.\n\n0. Subira`
//     };

//     return `CON ${messages[session.language]}`;
//   }

//   private getSupportRequestPrompt(language: Language): string {
//     const messages = {
//       [Language.EN]: 'Describe the support you need (minimum 10 characters):',
//       [Language.RW]: 'Sobanura inkunga ukeneye (byibuze imibare 10):'
//     };
    
//     return `CON ${messages[language]}\n\n${this.getTranslation(language, 'enter_response')}`;
//   }

//   private getLanguageSelectionMenu(): string {
//     return `CON Select Language / Hitamo Ururimi:\n\n1. English\n2. Kinyarwanda\n\nEnter option / Andika option:`;
//   }

//   private async getStaffTrackingMenu(session: UssdSession): Promise<string> {
//     const assignedBeneficiaries = session.data.staffData?.beneficiariesToTrack || [];
    
//     if (assignedBeneficiaries.length === 0) {
//       return this.getErrorMessage(
//         session.language,
//         'No beneficiaries assigned to you for tracking.'
//       );
//     }

//     let response = session.language === Language.EN
//       ? 'Assigned Beneficiaries:\n\n'
//       : 'Abakiriya Bashyizweho:\n\n';

//     // Get beneficiary names (simplified - in reality you'd fetch from DB)
//     const beneficiaries = await this.beneficiariesService.findByIds(assignedBeneficiaries.slice(0, 5));
    
//     beneficiaries.forEach((beneficiary, index) => {
//       response += `${index + 1}. ${beneficiary.fullName}\n`;
//       response += `   ID: ${beneficiary.id.substring(0, 8)}...\n`;
//       response += `   Status: ${beneficiary.status}\n\n`;
//     });

//     response += session.language === Language.EN
//       ? 'Select beneficiary to track (1-5) or\n0. Back'
//       : 'Hitamo umukiriya wo kukurikirana (1-5) cyangwa\n0. Subira';

//     session.data.selectedOptions.trackingBeneficiaries = beneficiaries;
//     return `CON ${response}`;
//   }

//   private async getStaffAttendanceMenu(session: UssdSession): Promise<string> {
//     // Similar to tracking menu but for attendance
//     return this.getComingSoonMessage(session.language);
//   }

//   private async handleDataSync(session: UssdSession): Promise<string> {
//     try {
//       // Sync offline data
//       const synced = await this.syncOfflineData(session);
      
//       if (synced) {
//         return this.getSuccessMessage(
//           session.language,
//           'Data synchronized successfully!'
//         );
//       } else {
//         return this.getErrorMessage(
//           session.language,
//           'No data to synchronize or sync failed.'
//         );
//       }
//     } catch (error) {
//       this.logger.error('Error syncing data:', error);
//       return this.getErrorMessage(session.language, 'Sync failed.');
//     }
//   }

//   private async syncOfflineData(session: UssdSession): Promise<boolean> {
//     // Implement offline data synchronization
//     // This would sync any pending data collected offline
//     return true;
//   }

//   private async handleTaskAssignment(session: UssdSession): Promise<string> {
//     const tasks = session.data.staffData?.assignedTasks || [];
    
//     if (tasks.length === 0) {
//       return this.getErrorMessage(
//         session.language,
//         'No tasks assigned to you.'
//       );
//     }

//     let response = session.language === Language.EN
//       ? 'Your Tasks:\n\n'
//       : 'Imirimo Yawe:\n\n';

//     tasks.slice(0, 5).forEach((task, index) => {
//       const dueDate = task.dueDate ? moment(task.dueDate).format('MMM DD') : 'No due date';
//       response += `${index + 1}. ${task.taskName}\n`;
//       response += `   Status: ${task.status}\n`;
//       response += `   Due: ${dueDate}\n\n`;
//     });

//     response += session.language === Language.EN
//       ? 'Select task to update (1-5) or\n0. Back'
//       : 'Hitamo umurimo wo kuvugurura (1-5) cyangwa\n0. Subira';

//     return `CON ${response}`;
//   }

//   private async handleViewReports(session: UssdSession): Promise<string> {
//     // Implementation for viewing reports
//     return this.getComingSoonMessage(session.language);
//   }

//   private async handleRecurringDonation(session: UssdSession): Promise<string> {
//     // Implementation for recurring donations
//     return this.getComingSoonMessage(session.language);
//   }

//   // ==================== RESPONSE MESSAGES ====================
//   private getErrorMessage(language: Language, customMessage?: string): string {
//     const messages = {
//       [Language.EN]: customMessage || 'An error occurred. Please try again later.',
//       [Language.RW]: customMessage || 'Habaye ikosa. Ongera ugerageze nyuma.'
//     };
    
//     return `END ${messages[language]}`;
//   }

//   private getSuccessMessage(language: Language, message: string): string {
//     const messages = {
//       [Language.EN]: message,
//       [Language.RW]: message // In real implementation, translate this
//     };
    
//     return `END ${messages[language]}`;
//   }

//   private getInvalidOptionMessage(language: Language): string {
//     const messages = {
//       [Language.EN]: 'Invalid option. Please try again.',
//       [Language.RW]: 'Option ntabwo ari yo. Ongera ugerageze.'
//     };
    
//     return `CON ${messages[language]}\n\n${this.getTranslation(language, 'enter_option')}`;
//   }

//   private getInvalidInputMessage(language: Language, field: string): string {
//     const messages = {
//       [Language.EN]: `Invalid ${field}. Please enter a valid number.`,
//       [Language.RW]: `${field} ntabwo ari yo. Andika umubare ukwiye.`
//     };
    
//     return `CON ${messages[language]}\n\n${this.getTranslation(language, 'enter_response')}`;
//   }

//   private getAccessDeniedMessage(language: Language): string {
//     const messages = {
//       [Language.EN]: 'Access denied. You do not have permission for this service.',
//       [Language.RW]: 'Ntabwo wemerewe. Nta uburenganzira ufite kuri serivisi.'
//     };
    
//     return `END ${messages[language]}`;
//   }

//   private getExitMessage(language: Language): string {
//     const messages = {
//       [Language.EN]: 'Thank you for using LCEO USSD service. Goodbye!',
//       [Language.RW]: 'Murakoze gukoresha serivisi ya LCEO. Murabeho!'
//     };
    
//     return `END ${messages[language]}`;
//   }

//   private getComingSoonMessage(language: Language): string {
//     const messages = {
//       [Language.EN]: 'This feature is coming soon!',
//       [Language.RW]: 'Iyi serivisi izaza vuba!'
//     };
    
//     return `END ${messages[language]}`;
//   }

//   // ==================== PUBLIC API METHODS ====================
//   async getSessionById(id: string): Promise<UssdSession> {
//     const session = await this.ussdSessionRepository.findOne({
//       where: { id },
//     });

//     if (!session) {
//       throw new NotFoundException(`USSD session with ID ${id} not found`);
//     }

//     return session;
//   }

//   async getSessionsByPhone(phoneNumber: string, page: number = 1, limit: number = DEFAULT_PAGE_SIZE): Promise<{ sessions: UssdSession[]; total: number }> {
//     const take = Math.min(limit, MAX_PAGE_SIZE);
//     const skip = (page - 1) * take;

//     const [sessions, total] = await this.ussdSessionRepository.findAndCount({
//       where: { phoneNumber },
//       take,
//       skip,
//       order: { createdAt: 'DESC' },
//     });

//     return { sessions, total };
//   }

//   async getActiveSessions(): Promise<UssdSession[]> {
//     return await this.ussdSessionRepository.find({
//       where: { isActive: true },
//       order: { lastInteraction: 'DESC' },
//     });
//   }

//   async cleanupExpiredSessions(): Promise<{ deleted: number }> {
//     try {
//       const expirationTime = new Date(Date.now() - USSD_TIMEOUT * 1000);
      
//       const result = await this.ussdSessionRepository
//         .createQueryBuilder()
//         .delete()
//         .where('expires_at < :expirationTime', { expirationTime })
//         .orWhere('is_active = false AND completed_at < :expirationTime', { expirationTime })
//         .execute();
      
//       this.logger.log(`Cleaned up ${result.affected} expired USSD sessions`);
//       return { deleted: result.affected || 0 };
//     } catch (error) {
//       this.logger.error('Error cleaning up USSD sessions:', error);
//       return { deleted: 0 };
//     }
//   }

//   async getSessionStats(): Promise<UssdStatsDto> {
//     const total = await this.ussdSessionRepository.count();
//     const active = await this.ussdSessionRepository.count({ where: { isActive: true } });
    
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);
    
//     const todayCount = await this.ussdSessionRepository.count({
//       where: {
//         createdAt: Between(today, tomorrow),
//       },
//     });

//     const byUserType = await this.ussdSessionRepository
//       .createQueryBuilder()
//       .select('user_type, COUNT(*) as count')
//       .where('user_type IS NOT NULL')
//       .groupBy('user_type')
//       .getRawMany();

//     const byLanguage = await this.ussdSessionRepository
//       .createQueryBuilder()
//       .select('language, COUNT(*) as count')
//       .groupBy('language')
//       .getRawMany();

//     const avgSteps = await this.ussdSessionRepository
//       .createQueryBuilder()
//       .select('AVG(step_count)', 'avg')
//       .where('is_active = false')
//       .getRawOne();

//     const completed = await this.ussdSessionRepository.count({
//       where: { isActive: false, completedAt: Not(null) },
//     });

//     const completionRate = total > 0 ? (completed / total) * 100 : 0;

//     return {
//       total,
//       active,
//       today: todayCount,
//       byUserType: byUserType.reduce((acc, curr) => {
//         acc[curr.user_type] = parseInt(curr.count);
//         return acc;
//       }, {}),
//       byLanguage: byLanguage.reduce((acc, curr) => {
//         acc[curr.language] = parseInt(curr.count);
//         return acc;
//       }, {}),
//       avgSteps: parseFloat(avgSteps?.avg || '0'),
//       completionRate: parseFloat(completionRate.toFixed(2)),
//     };
//   }

//   async getSessionAnalytics(startDate: Date, endDate: Date): Promise<any> {
//     const sessions = await this.ussdSessionRepository.find({
//       where: {
//         createdAt: Between(startDate, endDate),
//       },
//       order: { createdAt: 'ASC' },
//     });

//     // Group by date
//     const dailyStats = sessions.reduce((acc, session) => {
//       const date = moment(session.createdAt).format('YYYY-MM-DD');
//       if (!acc[date]) {
//         acc[date] = {
//           date,
//           total: 0,
//           active: 0,
//           completed: 0,
//           avgSteps: 0,
//           byUserType: {},
//           byLanguage: {},
//         };
//       }
      
//       acc[date].total++;
//       if (session.isActive) acc[date].active++;
//       if (session.completedAt) acc[date].completed++;
      
//       // Update user type counts
//       if (session.userType) {
//         if (!acc[date].byUserType[session.userType]) {
//           acc[date].byUserType[session.userType] = 0;
//         }
//         acc[date].byUserType[session.userType]++;
//       }
      
//       // Update language counts
//       if (!acc[date].byLanguage[session.language]) {
//         acc[date].byLanguage[session.language] = 0;
//       }
//       acc[date].byLanguage[session.language]++;
      
//       // Track steps for average
//       if (!acc[date].steps) acc[date].steps = [];
//       acc[date].steps.push(session.stepCount);
      
//       return acc;
//     }, {});

//     // Calculate averages
//     Object.values(dailyStats).forEach((stat: any) => {
//       if (stat.steps && stat.steps.length > 0) {
//         const sum = stat.steps.reduce((a: number, b: number) => a + b, 0);
//         stat.avgSteps = parseFloat((sum / stat.steps.length).toFixed(2));
//         delete stat.steps;
//       }
//     });

//     return {
//       period: {
//         start: startDate,
//         end: endDate,
//         days: Object.keys(dailyStats).length,
//       },
//       total: sessions.length,
//       active: sessions.filter(s => s.isActive).length,
//       completed: sessions.filter(s => s.completedAt).length,
//       completionRate: sessions.length > 0 
//         ? parseFloat(((sessions.filter(s => s.completedAt).length / sessions.length) * 100).toFixed(2))
//         : 0,
//       dailyStats: Object.values(dailyStats),
//     };
//   }

//   async forceEndSession(sessionId: string): Promise<boolean> {
//     try {
//       const session = await this.ussdSessionRepository.findOne({
//         where: { sessionId },
//       });

//       if (!session) {
//         return false;
//       }

//       session.isActive = false;
//       session.completedAt = new Date();
//       await this.ussdSessionRepository.save(session);

//       return true;
//     } catch (error) {
//       this.logger.error('Error force ending session:', error);
//       return false;
//     }
//   }
// }