// src/modules/ussd/ussd.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { UssdSession } from '../entities/ussd-session.entity';
import { UssdRequestDto } from '../dto/ussd-request.dto';
import { UsersService } from '../../users/services/users.service';
import { BeneficiariesService } from '../../beneficiaries/services/beneficiaries.service';
import { WeeklyTrackingService } from '../../beneficiaries/services/weekly-tracking.service';
import { GoalsService } from '../../beneficiaries/services/goals.service';
import { EmergencyContactsService } from '../../beneficiaries/services/emergency-contacts.service';
import { CreateGoalDto } from '../../beneficiaries/dto/create-goal.dto';
import { CreateEmergencyContactDto } from '../../beneficiaries/dto/create-emergency-contact.dto';
import { CreateTrackingDto } from '../../beneficiaries/dto/create-tracking.dto';

import {
    UserType,
    Language,
    AttendanceStatus,
    GoalType,
    GoalStatus,
    USSD_TIMEOUT
} from '../../../config/constants';
import { Goal } from '../../beneficiaries/entities/goal.entity';
import { EmergencyContact } from '../../beneficiaries/entities/emergency-contact.entity';

@Injectable()
export class UssdService {
    private readonly logger = new Logger(UssdService.name);

    constructor(
        @InjectRepository(UssdSession)
        private ussdSessionRepository: Repository<UssdSession>,
        private configService: ConfigService,
        private usersService: UsersService,
        private beneficiariesService: BeneficiariesService,
        private weeklyTrackingService: WeeklyTrackingService,
        private goalsService: GoalsService,
        private emergencyContactsService: EmergencyContactsService,
    ) { }

    async handleUssdRequest(ussdRequest: UssdRequestDto): Promise<string> {
        try {
            const { phoneNumber, sessionId, text } = ussdRequest;

            // Find or create session
            let session = await this.findOrCreateSession(ussdRequest);

            // FIX 1: Check if session is expired due to INACTIVITY
            if (this.isSessionExpired(session)) {
                this.logger.log(`Session ${sessionId} expired due to inactivity`);

                // Mark as inactive
                session.isActive = false;
                await this.ussdSessionRepository.save(session);

                // Create new session for this request
                session = await this.createNewSession(ussdRequest);

                // Return expired message with option to start fresh
                return `CON Your previous session expired due to inactivity.\n` +
                    `Press 1 to start fresh or 0 to exit.\n` +
                    `1. Start Fresh\n0. Exit`;
            }

            // FIX 2: EXTEND session on EVERY interaction (user is ACTIVE!)
            await this.extendSession(session);

            // Identify user if not already identified
            if (!session.userType) {
                await this.identifyUser(session, phoneNumber);
            }

            const inputs = text ? text.split('*') : [];

            // Check if user wants to go back (00 is common for back in USSD)
            const lastInput = inputs.length > 0 ? inputs[inputs.length - 1] : '';
            const isBack = lastInput === '00';
            const isNewSession = text === '';

            let inputToProcess = isNewSession ? '' : lastInput;

            // Handle fresh start after expiration
            if (text === '1' && session.menuState === 'expired') {
                session.menuState = 'main_menu';
                await this.saveSession(session);
                return this.getMainMenu(session);
            }

            if (isBack && !isNewSession) {
                return this.handleBack(session);
            }

            const response = await this.processState(session, inputToProcess, isNewSession);

            // FIX 3: Save session AFTER processing to ensure expiration is updated
            await this.saveSession(session);

            return response;

        } catch (error) {
            this.logger.error('Error handling USSD:', error);
            return 'END System Error. Please try again.\nEND Ikosa. Ongera ugerageze.';
        }
    }

    // FIX 4: New method to check if session expired due to inactivity
    private isSessionExpired(session: UssdSession): boolean {
        const now = new Date();
        const inactiveTime = (now.getTime() - session.lastInteraction.getTime()) / 1000;

        // Session expires ONLY after USSD_TIMEOUT seconds of INACTIVITY
        return inactiveTime > USSD_TIMEOUT;
    }

    // FIX 5: New method to extend session on user activity
    private async extendSession(session: UssdSession): Promise<void> {
        const now = new Date();
        session.lastInteraction = now;
        session.expiresAt = new Date(now.getTime() + USSD_TIMEOUT * 1000);
        // Update metadata with network info if available
        if (!session.metadata) {
            session.metadata = {
                network: 'Unknown',
                device: 'USSD',
                serviceCode: '',
                errorCount: 0,
            };
        }
        // Don't save here - let the main flow save
    }

    private async createNewSession(ussdRequest: UssdRequestDto): Promise<UssdSession> {
        const now = new Date();
        const newSession = this.ussdSessionRepository.create({
            sessionId: ussdRequest.sessionId,
            phoneNumber: ussdRequest.phoneNumber,
            menuState: 'expired', // Special state for expired sessions
            data: {
                currentMenu: 'expired',
                previousMenu: null,
                selectedOptions: {},
                inputHistory: [],
            },
            lastInteraction: now,
            expiresAt: new Date(now.getTime() + USSD_TIMEOUT * 1000),
            isActive: true,
        });

        return await this.ussdSessionRepository.save(newSession);
    }

    private async findOrCreateSession(ussdRequest: UssdRequestDto): Promise<UssdSession> {
        let session = await this.ussdSessionRepository.findOne({
            where: { sessionId: ussdRequest.sessionId },
        });

        if (!session) {
            const now = new Date();
            session = this.ussdSessionRepository.create({
                sessionId: ussdRequest.sessionId,
                phoneNumber: ussdRequest.phoneNumber,
                menuState: 'initial',
                stepCount: 0, // Initialize to 0
                data: {
                    currentMenu: 'initial',
                    previousMenu: null,
                    selectedOptions: {},
                    inputHistory: [],
                },
                lastInteraction: now,
                expiresAt: new Date(now.getTime() + USSD_TIMEOUT * 1000),
                isActive: true,
                // FIX 1: Populate metadata from request
                metadata: {
                    network: 'Unknown', // You can get this from networkCode
                    device: 'USSD',
                    serviceCode: ussdRequest.serviceCode,
                    networkCode: ussdRequest.networkCode,
                    errorCount: 0,
                },
            });
            await this.ussdSessionRepository.save(session);
        }
        return session;
    }


    private async identifyUser(session: UssdSession, phoneNumber: string) {
        const user = await this.usersService.findByPhone(phoneNumber);
        if (user) {
            session.userType = user.userType;
            session.data.userId = user.id;
            session.language = user.language || Language.EN;

            if (user.userType === UserType.BENEFICIARY) {
                const beneficiary = await this.beneficiariesService.findBeneficiaryByUserId(user.id);
                if (beneficiary) {
                    session.data.beneficiaryId = beneficiary.id;
                }
            }
            await this.ussdSessionRepository.save(session);
        }
    }

    private async handleBack(session: UssdSession): Promise<string> {
        // Navigate to previous menu
        const previousMenu = session.data.previousMenu || 'main_menu';
        session.menuState = previousMenu;
        session.data.previousMenu = null;
        await this.saveSession(session);

        // Re-render the previous menu
        return this.renderMenu(session);
    }

    private async renderMenu(session: UssdSession): Promise<string> {
        switch (session.menuState) {
            case 'main_menu':
                return this.getMainMenu(session);
            case 'goals_menu':
                return this.getGoalsMenu(session);
            case 'contacts_menu':
                return this.getContactsMenu(session);
            case 'view_contacts':
                return this.getViewContacts(session);
            case 'add_contact_name':
                return `CON ${this.t('enter_contact_name', session.language)}\n00. ${this.t('back', session.language)}`;
            case 'add_contact_phone':
                return `CON ${this.t('enter_contact_phone', session.language)}\n00. ${this.t('back', session.language)}`;
            case 'add_contact_relationship':
                return `CON ${this.t('enter_contact_relationship', session.language)}\n00. ${this.t('back', session.language)}`;
            case 'add_contact_address':
                return `CON ${this.t('enter_contact_address', session.language)}\n00. ${this.t('back', session.language)}`;
            case 'add_contact_primary':
                return `CON ${this.t('set_as_primary', session.language)}\n1. Yes\n2. No\n00. ${this.t('back', session.language)}`;
            case 'add_contact_confirm':
                return this.getContactConfirmMenu(session);
            case 'view_goals':
                return this.getViewGoals(session);
            case 'goal_details':
                return this.getGoalDetails(session);
            case 'create_goal_type':
                return `CON ${this.t('enter_goal_type', session.language)}\n00. ${this.t('back', session.language)}`;
            case 'create_goal_desc':
                return `CON ${this.t('enter_goal_desc', session.language)}\n00. ${this.t('back', session.language)}`;
            case 'create_goal_amount':
                return `CON ${this.t('enter_goal_amount', session.language)}\n00. ${this.t('back', session.language)}`;
            case 'create_goal_date':
                return `CON ${this.t('enter_goal_date', session.language)}\n00. ${this.t('back', session.language)}`;
            case 'create_goal_confirm':
                return this.getGoalConfirmMenu(session);
            case 'tracking_income':
                return `CON ${this.t('tracking_income', session.language)}\n00. ${this.t('back', session.language)}`;
            case 'tracking_expenses':
                return `CON ${this.t('tracking_expenses', session.language)}\n00. ${this.t('back', session.language)}`;
            case 'tracking_capital':
                return `CON ${this.t('tracking_capital', session.language)}\n00. ${this.t('back', session.language)}`;
            case 'tracking_attendance':
                return `CON ${this.t('tracking_attendance', session.language)}\n00. ${this.t('back', session.language)}`;
            case 'tracking_confirm':
                return this.getTrackingConfirmMenu(session);
            case 'language_select':
                return `CON ${this.t('lang_select', session.language)}\n00. ${this.t('back', session.language)}`;
            default:
                return this.getMainMenu(session);
        }
    }

    private async processState(session: UssdSession, input: string, isNewSession: boolean): Promise<string> {

        if (!isNewSession) {
            session.stepCount += 1;

            // Track input in history
            if (!session.data.inputHistory) {
                session.data.inputHistory = [];
            }
            session.data.inputHistory.push(input);
        }

        if (!session.userType || !session.data.userId) {
            return 'END Not registered. Please contact support.\nEND Ntabwo wiyandikishije. Hamagara support.';
        }

        if (session.userType !== UserType.BENEFICIARY) {
            return 'END Service only available for Beneficiaries.\nEND Serivisi ku Banyamuryango gusa.';
        }

        if (isNewSession) {
            session.menuState = 'main_menu';
            return this.getMainMenu(session);
        }

        // Save current state as previous before processing
        session.data.previousMenu = session.menuState;

        switch (session.menuState) {
            case 'main_menu':
                return this.handleMainMenu(session, input);
            case 'goals_menu':
                return this.handleGoalsMenu(session, input);
            case 'view_goals':
                return this.handleViewGoals(session, input);
            case 'goal_details':
                return this.handleGoalDetails(session, input);
            case 'create_goal_type':
                return this.handleCreateGoalType(session, input);
            case 'create_goal_desc':
                return this.handleCreateGoalDesc(session, input);
            case 'create_goal_amount':
                return this.handleCreateGoalAmount(session, input);
            case 'create_goal_date':
                return this.handleCreateGoalDate(session, input);
            case 'create_goal_confirm':
                return this.handleCreateGoalConfirm(session, input);

            case 'contacts_menu':
                return this.handleContactsMenu(session, input);
            case 'view_contacts':
                return this.handleViewContacts(session, input);
            case 'add_contact_name':
                return this.handleAddContactName(session, input);
            case 'add_contact_phone':
                return this.handleAddContactPhone(session, input);
            case 'add_contact_relationship':
                return this.handleAddContactRelationship(session, input);
            case 'add_contact_address':
                return this.handleAddContactAddress(session, input);
            case 'add_contact_primary':
                return this.handleAddContactPrimary(session, input);
            case 'add_contact_confirm':
                return this.handleAddContactConfirm(session, input);

            case 'tracking_income':
                return this.handleTrackingIncome(session, input);
            case 'tracking_expenses':
                return this.handleTrackingExpenses(session, input);
            case 'tracking_capital':
                return this.handleTrackingCapital(session, input);
            case 'tracking_attendance':
                return this.handleTrackingAttendance(session, input);
            case 'tracking_confirm':
                return this.handleTrackingConfirm(session, input);

            case 'language_select':
                return this.handleLanguageSelect(session, input);

            default:
                session.menuState = 'main_menu';
                return this.getMainMenu(session);
        }
    }

    private async completeSession(session: UssdSession): Promise<void> {
        const now = new Date();
        session.isActive = false;
        session.completedAt = now;

        // Calculate session duration
        if (session.metadata) {
            const startTime = session.createdAt || session.lastInteraction;
            const duration = (now.getTime() - startTime.getTime()) / 1000; // in seconds
            session.metadata.sessionDuration = Math.round(duration);
        }

        await this.ussdSessionRepository.save(session);
    }

    private async saveSession(session: UssdSession) {
        // Ensure lastInteraction and expiresAt are set
        if (!session.lastInteraction) {
            session.lastInteraction = new Date();
        }
        await this.ussdSessionRepository.save(session);
    }

    private t(key: string, lang: Language): string {
        const translations: Record<string, { en: string; rw: string }> = {
            welcome: { en: "Welcome", rw: "Murakaza neza" },
            back: { en: "Back", rw: "Subira" },
            confirm: { en: "Confirm?", rw: "Emeza?" },
            yes: { en: "Yes", rw: "Yego" },
            no: { en: "No", rw: "Oya" },
            main_menu: {
                en: "1. Weekly Tracking\n2. Goals\n3. Emergency Contacts\n4. Change Language\n0. Exit",
                rw: "1. Gukurikirana Buri Cyumweru\n2. Intego\n3. Nimero z'Ubutabazi\n4. Hindura Ururimi\n0. Sohoka"
            },
            goals_menu: {
                en: "1. View My Goals\n2. Create New Goal\n0. Main Menu",
                rw: "1. Reba Intego\n2. Intego Nshya\n0. Iyindi"
            },
            contacts_menu: {
                en: "1. View Emergency Contacts\n2. Add Emergency Contact\n3. Set Primary Contact\n0. Main Menu",
                rw: "1. Reba Nimero z'Ubutabazi\n2. Ongeraho Nimero\n3. Shyiraho i'ibanze\n0. Iyindi"
            },
            no_contacts: {
                en: "No emergency contacts found.\n1. Add Contact\n0. Back",
                rw: "Nta nimero z'ubutabazi.\n1. Ongeraho\n0. Subira"
            },
            enter_contact_name: {
                en: "Enter contact name:",
                rw: "Andika izina:"
            },
            enter_contact_phone: {
                en: "Enter phone number (e.g., 078XXXXXXX):",
                rw: "Andika numero (nka 078XXXXXXX):"
            },
            enter_contact_relationship: {
                en: "Enter relationship (e.g., spouse, parent):",
                rw: "Andika isano (nka umugore, nyina):"
            },
            enter_contact_address: {
                en: "Enter address:",
                rw: "Andika aho batuye:"
            },
            set_as_primary: {
                en: "Set as primary contact?",
                rw: "Shyiraho nk'ibanze?"
            },
            contact_created: {
                en: "Contact added successfully!",
                rw: "Numero yongewemo neza!"
            },
            primary_contact_updated: {
                en: "Primary contact updated!",
                rw: "Numero y'ibanze yahinduwe!"
            },
            select_primary_contact: {
                en: "Select contact to set as primary:",
                rw: "Hitamo numero yo kugira i'ibanze:"
            },
            no_goals: {
                en: "No goals found.\n1. Create Goal\n0. Back",
                rw: "Nta ntego.\n1. Intego Nshya\n0. Subira"
            },
            enter_goal_type: {
                en: "Choose Type:\n1. Business\n2. Personal\n3. Financial\n0. Back",
                rw: "Hitamo Ubwoko:\n1. Ubucuruzi\n2. Giti Cyawe\n3. Imari\n0. Subira"
            },
            enter_goal_desc: {
                en: "Enter Goal Description:",
                rw: "Andika Ibisobanuro by'Intego:"
            },
            enter_goal_amount: {
                en: "Enter Target Amount (RWF):",
                rw: "Andika Amafaranga wifuza (RWF):"
            },
            enter_goal_date: {
                en: "Enter Target Date (YYYY-MM-DD):",
                rw: "Andika Italiki (YYYY-MM-DD):"
            },
            goal_created: {
                en: "Goal Created Successfully!",
                rw: "Intego yashyizweho neza!"
            },
            tracking_income: {
                en: "Enter Income this week (RWF):",
                rw: "Inyungu y'iki cyumweru (RWF):"
            },
            tracking_expenses: {
                en: "Enter Expenses this week (RWF):",
                rw: "Amafaranga wasohoye (RWF):"
            },
            tracking_capital: {
                en: "Enter Current Capital (RWF):",
                rw: "Igishoro usigaranye (RWF):"
            },
            tracking_attendance: {
                en: "Attendance:\n1. Present\n2. Absent\n3. Late\n0. Back",
                rw: "Kwitabira:\n1. Nahabaye\n2. Ntabwo nahabaye\n3. Nakererewe\n0. Subira"
            },
            tracking_confirm: {
                en: "Submit weekly report?",
                rw: "Emeza raporo y'iki cyumweru?"
            },
            tracking_submitted: {
                en: "Report Submitted Successfully!",
                rw: "Raporo Yatanzwe Neza!"
            },
            lang_select: {
                en: "Choose Language:\n1. English\n2. Kinyarwanda\n0. Back",
                rw: "Hitamo Ururimi:\n1. English\n2. Kinyarwanda\n0. Subira"
            },
            invalid: {
                en: "Invalid option. Try again.",
                rw: "Ibyo uhisemo ntibibaho. Ongera ugerageze."
            },
            exit: {
                en: "Thank you for using our service!",
                rw: "Urakoze gukoresha serivisi yacu!"
            },
            confirm_cancel: {
                en: "Cancel and exit? 1. Yes 2. No",
                rw: "Kureka? 1. Yego 2. Oya"
            }
        };
        return translations[key]?.[lang] || key;
    }

    // ==================== MENU RENDERERS ====================

    private async getMainMenu(session: UssdSession): Promise<string> {
        // Don't save here - let the caller save
        return `CON ${this.t('welcome', session.language)}\n${this.t('main_menu', session.language)}`;
    }

    private async getGoalsMenu(session: UssdSession): Promise<string> {
        return `CON ${this.t('goals_menu', session.language)}`;
    }

    private async getContactsMenu(session: UssdSession): Promise<string> {
        return `CON ${this.t('contacts_menu', session.language)}`;
    }

    private async getViewContacts(session: UssdSession): Promise<string> {
        if (!session.data.beneficiaryId) return `CON ${this.t('invalid', session.language)}`;

        const response = await this.emergencyContactsService.getBeneficiaryContacts(
            session.data.beneficiaryId,
            { page: 1, limit: 5 }
        );
        const contacts = response.data;

        if (contacts.length === 0) {
            return `CON ${this.t('no_contacts', session.language)}`;
        }

        const list = contacts.map((c, i) => {
            const primary = c.isPrimary ? ' (Primary)' : '';
            return `${i + 1}. ${c.name} - ${c.phone}${primary}`;
        }).join('\n');

        session.data.contactsList = contacts;
        await this.saveSession(session);

        return `CON ${list}\n0. Back\n#. Next page`;
    }

    private async getViewGoals(session: UssdSession): Promise<string> {
        if (!session.data.beneficiaryId) return `CON ${this.t('invalid', session.language)}`;

        const response = await this.goalsService.getBeneficiaryGoals(
            session.data.beneficiaryId,
            { page: 1, limit: 5 }
        );
        const goals = response.data;

        if (goals.length === 0) {
            return `CON ${this.t('no_goals', session.language)}`;
        }

        const list = goals.map((g, i) => {
            const progress = g.targetAmount > 0 ? ((g.currentProgress / g.targetAmount) * 100).toFixed(0) : '0';
            return `${i + 1}. ${g.description.substring(0, 15)}... (${progress}%)`;
        }).join('\n');

        session.data.goalsList = goals;
        await this.saveSession(session);

        return `CON ${list}\nEnter number for details\n0. Back`;
    }

    private async getGoalDetails(session: UssdSession): Promise<string> {
        const goalIndex = session.data.selectedGoalIndex;
        const goals = session.data.goalsList || [];

        if (goalIndex === undefined || !goals[goalIndex]) {
            return `CON ${this.t('invalid', session.language)}`;
        }

        const goal = goals[goalIndex];
        const progress = goal.targetAmount > 0 ? ((goal.currentProgress / goal.targetAmount) * 100).toFixed(0) : '0';

        const details =
            `Goal: ${goal.description}\n` +
            `Progress: ${goal.currentProgress}/${goal.targetAmount} (${progress}%)\n` +
            `Status: ${goal.status}\n` +
            `Target Date: ${new Date(goal.targetDate).toLocaleDateString()}\n` +
            `1. Update Progress\n2. View Milestones\n0. Back`;

        return `CON ${details}`;
    }

    private async getContactConfirmMenu(session: UssdSession): Promise<string> {
        const contact = session.data.newContact;
        if (!contact) return `CON ${this.t('invalid', session.language)}`;

        return `CON Confirm contact details:\n` +
            `Name: ${contact.name || ''}\n` +
            `Phone: ${contact.phone || ''}\n` +
            `Relationship: ${contact.relationship || ''}\n` +
            `Address: ${contact.address || ''}\n` +
            `Primary: ${contact.isPrimary ? 'Yes' : 'No'}\n` +
            `1. Save\n2. Edit\n0. Cancel`;
    }

    private async getGoalConfirmMenu(session: UssdSession): Promise<string> {
        const goal = session.data.newGoal;
        if (!goal) return `CON ${this.t('invalid', session.language)}`;

        return `CON Confirm goal:\n` +
            `Type: ${goal.type || ''}\n` +
            `Description: ${goal.description || ''}\n` +
            `Target: ${goal.targetAmount || 0} RWF\n` +
            `Target Date: ${goal.targetDate || ''}\n` +
            `1. Save\n2. Edit\n0. Cancel`;
    }

    private async getTrackingConfirmMenu(session: UssdSession): Promise<string> {
        const data = session.data.trackingData;
        if (!data) return `CON ${this.t('invalid', session.language)}`;

        return `CON Confirm weekly report:\n` +
            `Income: ${data.incomeThisWeek || 0} RWF\n` +
            `Expenses: ${data.expensesThisWeek || 0} RWF\n` +
            `Capital: ${data.currentCapital || 0} RWF\n` +
            `Attendance: ${data.attendance || ''}\n` +
            `1. Submit\n2. Edit\n0. Cancel`;
    }

    // ==================== MAIN MENU HANDLER ====================

    private async handleMainMenu(session: UssdSession, input: string): Promise<string> {
        switch (input) {
            case '1': // Tracking
                session.data.trackingData = {};
                session.menuState = 'tracking_income';
                await this.saveSession(session);
                return `CON ${this.t('tracking_income', session.language)}\n00. ${this.t('back', session.language)}`;

            case '2': // Goals
                session.menuState = 'goals_menu';
                await this.saveSession(session);
                return this.getGoalsMenu(session);

            case '3': // Emergency Contacts
                session.menuState = 'contacts_menu';
                await this.saveSession(session);
                return this.getContactsMenu(session);

            case '4': // Language
                session.menuState = 'language_select';
                await this.saveSession(session);
                return `CON ${this.t('lang_select', session.language)}`;

            case '0': // Exit
                await this.completeSession(session);
                return `END ${this.t('exit', session.language)}`;

            default:
                return `CON ${this.t('invalid', session.language)}\n${this.t('main_menu', session.language)}`;
        }
    }

    // ==================== GOALS HANDLERS ====================

    private async handleGoalsMenu(session: UssdSession, input: string): Promise<string> {
        switch (input) {
            case '1': // View Goals
                session.menuState = 'view_goals';
                await this.saveSession(session);
                return this.getViewGoals(session);

            case '2': // Create New Goal
                session.data.newGoal = {};
                session.menuState = 'create_goal_type';
                await this.saveSession(session);
                return `CON ${this.t('enter_goal_type', session.language)}`;

            case '0': // Back to Main Menu
                session.menuState = 'main_menu';
                return this.getMainMenu(session);

            default:
                return `CON ${this.t('invalid', session.language)}\n${this.getGoalsMenu(session)}`;
        }
    }

    private async handleViewGoals(session: UssdSession, input: string): Promise<string> {
        if (input === '0') {
            session.menuState = 'goals_menu';
            return this.getGoalsMenu(session);
        }

        const index = parseInt(input) - 1;
        const goals = session.data.goalsList || [];

        if (index >= 0 && index < goals.length) {
            session.data.selectedGoalIndex = index;
            session.menuState = 'goal_details';
            await this.saveSession(session);
            return this.getGoalDetails(session);
        }

        return `CON ${this.t('invalid', session.language)}\n${this.getViewGoals(session)}`;
    }

    private async handleGoalDetails(session: UssdSession, input: string): Promise<string> {
        switch (input) {
            case '1': // Update Progress
                // TODO: Implement progress update flow
                return `CON Enter new progress amount (RWF):\n00. Back`;

            case '2': // View Milestones
                // TODO: Implement milestones view
                return `CON Milestones feature coming soon\n0. Back`;

            case '0':
                session.menuState = 'view_goals';
                return this.getViewGoals(session);

            default:
                return `CON ${this.t('invalid', session.language)}\n${this.getGoalDetails(session)}`;
        }
    }

    private async handleCreateGoalType(session: UssdSession, input: string): Promise<string> {
        if (input === '0') {
            session.menuState = 'goals_menu';
            return this.getGoalsMenu(session);
        }

        const types: Record<string, GoalType> = {
            '1': GoalType.BUSINESS,
            '2': GoalType.PERSONAL,
            '3': GoalType.FINANCIAL
        };
        const type = types[input];

        if (!type) {
            return `CON ${this.t('invalid', session.language)}\n${this.t('enter_goal_type', session.language)}`;
        }

        if (!session.data.newGoal) {
            session.data.newGoal = {};
        }
        session.data.newGoal.type = type;
        session.menuState = 'create_goal_desc';
        await this.saveSession(session);
        return `CON ${this.t('enter_goal_desc', session.language)}\n00. ${this.t('back', session.language)}`;
    }

    private async handleCreateGoalDesc(session: UssdSession, input: string): Promise<string> {
        if (input === '00') {
            session.menuState = 'create_goal_type';
            return `CON ${this.t('enter_goal_type', session.language)}`;
        }

        if (!input || input.trim() === '') {
            return `CON ${this.t('invalid', session.language)}\n${this.t('enter_goal_desc', session.language)}`;
        }

        if (!session.data.newGoal) {
            session.data.newGoal = {};
        }
        session.data.newGoal.description = input;
        session.menuState = 'create_goal_amount';
        await this.saveSession(session);
        return `CON ${this.t('enter_goal_amount', session.language)}\n00. ${this.t('back', session.language)}`;
    }

    private async handleCreateGoalAmount(session: UssdSession, input: string): Promise<string> {
        if (input === '00') {
            session.menuState = 'create_goal_desc';
            return `CON ${this.t('enter_goal_desc', session.language)}`;
        }

        const amount = parseFloat(input);
        if (isNaN(amount) || amount <= 0) {
            return `CON Invalid amount. Try again.\n00. Back`;
        }

        if (!session.data.newGoal) {
            session.data.newGoal = {};
        }
        session.data.newGoal.targetAmount = amount;
        session.menuState = 'create_goal_date';
        await this.saveSession(session);
        return `CON ${this.t('enter_goal_date', session.language)}\n00. ${this.t('back', session.language)}`;
    }

    private async handleCreateGoalDate(session: UssdSession, input: string): Promise<string> {
        if (input === '00') {
            session.menuState = 'create_goal_amount';
            return `CON ${this.t('enter_goal_amount', session.language)}`;
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(input)) {
            return `CON Invalid date format. Use YYYY-MM-DD\n00. Back`;
        }

        const targetDate = new Date(input);
        if (isNaN(targetDate.getTime())) {
            return `CON Invalid date. Use YYYY-MM-DD\n00. Back`;
        }

        if (!session.data.newGoal) {
            session.data.newGoal = {};
        }
        session.data.newGoal.targetDate = input;
        session.menuState = 'create_goal_confirm';
        await this.saveSession(session);
        return this.getGoalConfirmMenu(session);
    }

    private async handleCreateGoalConfirm(session: UssdSession, input: string): Promise<string> {
        switch (input) {
            case '1': // Save
                if (session.data.beneficiaryId && session.data.newGoal) {
                    try {
                        const newGoal = session.data.newGoal;
                        const dto: CreateGoalDto = {
                            type: newGoal.type!,
                            description: newGoal.description!,
                            targetAmount: newGoal.targetAmount!,
                            targetDate: newGoal.targetDate!,
                        };
                        await this.goalsService.createGoal(session.data.beneficiaryId, dto);

                        // Clear temporary data
                        session.data.newGoal = null;
                        session.menuState = 'goals_menu';
                        await this.saveSession(session);

                        return `CON ${this.t('goal_created', session.language)}\n\n${this.getGoalsMenu(session)}`;
                    } catch (error) {
                        this.logger.error('Error creating goal:', error);
                        return `END Error creating goal. Please try again.`;
                    }
                }
                return `END Error: Beneficiary not found.`;

            case '2': // Edit
                session.menuState = 'create_goal_type';
                return `CON ${this.t('enter_goal_type', session.language)}`;

            case '0': // Cancel
                session.data.newGoal = null;
                session.menuState = 'goals_menu';
                return this.getGoalsMenu(session);

            default:
                return `CON ${this.t('invalid', session.language)}\n${this.getGoalConfirmMenu(session)}`;
        }
    }

    // ==================== EMERGENCY CONTACTS HANDLERS ====================

    private async handleContactsMenu(session: UssdSession, input: string): Promise<string> {
        switch (input) {
            case '1': // View Contacts
                session.menuState = 'view_contacts';
                await this.saveSession(session);
                return this.getViewContacts(session);

            case '2': // Add Contact
                session.data.newContact = {};
                session.menuState = 'add_contact_name';
                await this.saveSession(session);
                return `CON ${this.t('enter_contact_name', session.language)}\n00. ${this.t('back', session.language)}`;

            case '3': // Set Primary Contact
                return await this.handleSetPrimaryContact(session);

            case '0': // Back to Main Menu
                session.menuState = 'main_menu';
                return this.getMainMenu(session);

            default:
                return `CON ${this.t('invalid', session.language)}\n${this.getContactsMenu(session)}`;
        }
    }

    private async handleViewContacts(session: UssdSession, input: string): Promise<string> {
        if (input === '0') {
            session.menuState = 'contacts_menu';
            return this.getContactsMenu(session);
        }

        if (input === '1' && (!session.data.contactsList || session.data.contactsList.length === 0)) {
            // Create new contact from no contacts screen
            session.data.newContact = {};
            session.menuState = 'add_contact_name';
            await this.saveSession(session);
            return `CON ${this.t('enter_contact_name', session.language)}`;
        }

        return `CON ${this.t('invalid', session.language)}\n${this.getViewContacts(session)}`;
    }

    private async handleAddContactName(session: UssdSession, input: string): Promise<string> {
        if (input === '00') {
            session.menuState = 'contacts_menu';
            return this.getContactsMenu(session);
        }

        if (!input || input.trim() === '') {
            return `CON ${this.t('invalid', session.language)}\n${this.t('enter_contact_name', session.language)}`;
        }

        if (!session.data.newContact) {
            session.data.newContact = {};
        }
        session.data.newContact.name = input;
        session.menuState = 'add_contact_phone';
        await this.saveSession(session);
        return `CON ${this.t('enter_contact_phone', session.language)}\n00. ${this.t('back', session.language)}`;
    }

    private async handleAddContactPhone(session: UssdSession, input: string): Promise<string> {
        if (input === '00') {
            session.menuState = 'add_contact_name';
            return `CON ${this.t('enter_contact_name', session.language)}`;
        }

        // Validate Rwanda phone number
        const phoneRegex = /^(\+250|250|0)[78]\d{8}$/;
        if (!phoneRegex.test(input)) {
            return `CON Invalid phone number. Use format: 078XXXXXXX\n00. Back`;
        }

        if (!session.data.newContact) {
            session.data.newContact = {};
        }
        session.data.newContact.phone = input;
        session.menuState = 'add_contact_relationship';
        await this.saveSession(session);
        return `CON ${this.t('enter_contact_relationship', session.language)}\n00. ${this.t('back', session.language)}`;
    }

    private async handleAddContactRelationship(session: UssdSession, input: string): Promise<string> {
        if (input === '00') {
            session.menuState = 'add_contact_phone';
            return `CON ${this.t('enter_contact_phone', session.language)}`;
        }

        if (!input || input.trim() === '') {
            return `CON ${this.t('invalid', session.language)}\n${this.t('enter_contact_relationship', session.language)}`;
        }

        if (!session.data.newContact) {
            session.data.newContact = {};
        }
        session.data.newContact.relationship = input;
        session.menuState = 'add_contact_address';
        await this.saveSession(session);
        return `CON ${this.t('enter_contact_address', session.language)}\n00. ${this.t('back', session.language)}`;
    }

    private async handleAddContactAddress(session: UssdSession, input: string): Promise<string> {
        if (input === '00') {
            session.menuState = 'add_contact_relationship';
            return `CON ${this.t('enter_contact_relationship', session.language)}`;
        }

        if (!input || input.trim() === '') {
            return `CON ${this.t('invalid', session.language)}\n${this.t('enter_contact_address', session.language)}`;
        }

        if (!session.data.newContact) {
            session.data.newContact = {};
        }
        session.data.newContact.address = input;
        session.menuState = 'add_contact_primary';
        await this.saveSession(session);
        return `CON ${this.t('set_as_primary', session.language)}\n1. Yes\n2. No\n00. Back`;
    }

    private async handleAddContactPrimary(session: UssdSession, input: string): Promise<string> {
        if (input === '00') {
            session.menuState = 'add_contact_address';
            return `CON ${this.t('enter_contact_address', session.language)}`;
        }

        let isPrimary = false;
        if (input === '1') {
            isPrimary = true;
        } else if (input === '2') {
            isPrimary = false;
        } else {
            return `CON ${this.t('invalid', session.language)}\n${this.t('set_as_primary', session.language)}\n1. Yes\n2. No`;
        }

        if (!session.data.newContact) {
            session.data.newContact = {};
        }
        session.data.newContact.isPrimary = isPrimary;
        session.menuState = 'add_contact_confirm';
        await this.saveSession(session);
        return this.getContactConfirmMenu(session);
    }

    private async handleAddContactConfirm(session: UssdSession, input: string): Promise<string> {
        switch (input) {
            case '1': // Save
                if (session.data.beneficiaryId && session.data.newContact) {
                    try {
                        const newContact = session.data.newContact;
                        const dto: CreateEmergencyContactDto = {
                            name: newContact.name!,
                            phone: newContact.phone!,
                            relationship: newContact.relationship!,
                            address: newContact.address!,
                            isPrimary: newContact.isPrimary || false,
                        };

                        await this.emergencyContactsService.createContact(session.data.beneficiaryId, dto);

                        // Clear temporary data
                        session.data.newContact = null;
                        session.menuState = 'contacts_menu';
                        await this.saveSession(session);

                        return `CON ${this.t('contact_created', session.language)}\n\n${this.getContactsMenu(session)}`;
                    } catch (error) {
                        this.logger.error('Error creating contact:', error);
                        return `END Error creating contact. Please try again.`;
                    }
                }
                return `END Error: Beneficiary not found.`;

            case '2': // Edit
                session.menuState = 'add_contact_name';
                return `CON ${this.t('enter_contact_name', session.language)}`;

            case '0': // Cancel
                session.data.newContact = null;
                session.menuState = 'contacts_menu';
                return this.getContactsMenu(session);

            default:
                return `CON ${this.t('invalid', session.language)}\n${this.getContactConfirmMenu(session)}`;
        }
    }

    private async handleSetPrimaryContact(session: UssdSession): Promise<string> {
        if (!session.data.beneficiaryId) {
            return `CON ${this.t('invalid', session.language)}`;
        }

        const response = await this.emergencyContactsService.getBeneficiaryContacts(
            session.data.beneficiaryId,
            { page: 1, limit: 10 }
        );
        const contacts = response.data;

        if (contacts.length === 0) {
            return `CON ${this.t('no_contacts', session.language)}`;
        }

        // Store contacts in session for selection
        session.data.contactsList = contacts;
        session.menuState = 'select_primary_contact';
        await this.saveSession(session);

        const list = contacts.map((c, i) =>
            `${i + 1}. ${c.name} ${c.isPrimary ? '(Current Primary)' : ''}`
        ).join('\n');

        return `CON ${this.t('select_primary_contact', session.language)}\n${list}\n0. Back`;
    }

    // ==================== WEEKLY TRACKING HANDLERS ====================

    private async handleTrackingIncome(session: UssdSession, input: string): Promise<string> {
        if (input === '00') {
            session.menuState = 'main_menu';
            return this.getMainMenu(session);
        }

        const amount = parseFloat(input);
        if (isNaN(amount) || amount < 0) {
            return `CON Invalid amount. Try again.\n00. Back`;
        }

        if (!session.data.trackingData) {
            session.data.trackingData = {};
        }
        session.data.trackingData.incomeThisWeek = amount;
        session.menuState = 'tracking_expenses';
        await this.saveSession(session);
        return `CON ${this.t('tracking_expenses', session.language)}\n00. ${this.t('back', session.language)}`;
    }

    private async handleTrackingExpenses(session: UssdSession, input: string): Promise<string> {
        if (input === '00') {
            session.menuState = 'tracking_income';
            return `CON ${this.t('tracking_income', session.language)}`;
        }

        const amount = parseFloat(input);
        if (isNaN(amount) || amount < 0) {
            return `CON Invalid amount. Try again.\n00. Back`;
        }

        if (!session.data.trackingData) {
            session.data.trackingData = {};
        }
        session.data.trackingData.expensesThisWeek = amount;
        session.menuState = 'tracking_capital';
        await this.saveSession(session);
        return `CON ${this.t('tracking_capital', session.language)}\n00. ${this.t('back', session.language)}`;
    }

    private async handleTrackingCapital(session: UssdSession, input: string): Promise<string> {
        if (input === '00') {
            session.menuState = 'tracking_expenses';
            return `CON ${this.t('tracking_expenses', session.language)}`;
        }

        const amount = parseFloat(input);
        if (isNaN(amount) || amount < 0) {
            return `CON Invalid amount. Try again.\n00. Back`;
        }

        if (!session.data.trackingData) {
            session.data.trackingData = {};
        }
        session.data.trackingData.currentCapital = amount;
        session.menuState = 'tracking_attendance';
        await this.saveSession(session);
        return `CON ${this.t('tracking_attendance', session.language)}`;
    }

    private async handleTrackingAttendance(session: UssdSession, input: string): Promise<string> {
        if (input === '00') {
            session.menuState = 'tracking_capital';
            return `CON ${this.t('tracking_capital', session.language)}`;
        }

        const statusMap: Record<string, AttendanceStatus> = {
            '1': AttendanceStatus.PRESENT,
            '2': AttendanceStatus.ABSENT,
            '3': AttendanceStatus.LATE
        };
        const status = statusMap[input];

        if (!status) {
            return `CON ${this.t('invalid', session.language)}\n${this.t('tracking_attendance', session.language)}`;
        }

        if (!session.data.trackingData) {
            session.data.trackingData = {};
        }
        session.data.trackingData.attendance = status;
        session.menuState = 'tracking_confirm';
        await this.saveSession(session);
        return this.getTrackingConfirmMenu(session);
    }

    private async handleTrackingConfirm(session: UssdSession, input: string): Promise<string> {
        switch (input) {
            case '1': // Submit
                if (session.data.beneficiaryId && session.data.trackingData && session.data.userId) {
                    try {
                        const trackingData = session.data.trackingData;
                        const payload: CreateTrackingDto = {
                            weekEnding: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
                            attendance: trackingData.attendance || AttendanceStatus.PRESENT,
                            incomeThisWeek: trackingData.incomeThisWeek || 0,
                            expensesThisWeek: trackingData.expensesThisWeek || 0,
                            currentCapital: trackingData.currentCapital || 0,
                            challenges: 'Submitted via USSD',
                            solutionsImplemented: 'Submitted via USSD',
                            notes: 'Weekly tracking via USSD',
                            taskCompletionStatus: undefined, // This can be undefined as it's optional
                            isOfflineSync: false
                        };

                        await this.weeklyTrackingService.createTracking(
                            session.data.beneficiaryId,
                            payload,
                            session.data.userId,
                            UserType.BENEFICIARY
                        );

                        // Clear tracking data
                        session.data.trackingData = null;
                        session.menuState = 'main_menu';
                        await this.saveSession(session);

                        return `CON ${this.t('tracking_submitted', session.language)}\n\n${this.getMainMenu(session)}`;
                    } catch (error) {
                        if (session.metadata) {
                            session.metadata.errorCount = (session.metadata.errorCount || 0) + 1;
                        }
                        this.logger.error('Error submitting tracking:', error);
                        return `END Error submitting report. Please try again.`;
                    }
                }
                return `END Error: Beneficiary not found.`;

            case '2': // Edit
                session.menuState = 'tracking_income';
                return `CON ${this.t('tracking_income', session.language)}`;

            case '0': // Cancel
                session.data.trackingData = null;
                session.menuState = 'main_menu';
                return this.getMainMenu(session);

            default:
                return `CON ${this.t('invalid', session.language)}\n${this.getTrackingConfirmMenu(session)}`;
        }
    }

    // ==================== LANGUAGE HANDLER ====================

    private async handleLanguageSelect(session: UssdSession, input: string): Promise<string> {
        if (input === '00') {
            session.menuState = 'main_menu';
            return this.getMainMenu(session);
        }

        if (input === '1') {
            session.language = Language.EN;
        } else if (input === '2') {
            session.language = Language.RW;
        } else {
            return `CON ${this.t('invalid', session.language)}\n${this.t('lang_select', session.language)}`;
        }

        // Update user's language preference
        if (session.data.userId) {
            await this.usersService.update(session.data.userId, { language: session.language });
        }

        session.menuState = 'main_menu';
        return this.getMainMenu(session);
    }

    // Optional: Cleanup expired sessions periodically
    async cleanupExpiredSessions(): Promise<void> {
        const expiredTime = new Date(Date.now() - USSD_TIMEOUT * 1000);
        await this.ussdSessionRepository.update(
            {
                lastInteraction: LessThan(expiredTime),
                isActive: true
            },
            { isActive: false }
        );




    }

    async getSessionStats(): Promise<any> {
        const totalSessions = await this.ussdSessionRepository.count();
        const activeSessions = await this.ussdSessionRepository.count({ where: { isActive: true } });
        const completedSessions = await this.ussdSessionRepository.count({ where: { completedAt: Not(IsNull()) } });

        const avgSteps = await this.ussdSessionRepository
            .createQueryBuilder('session')
            .select('AVG(session.stepCount)', 'avg')
            .where('session.completedAt IS NOT NULL')
            .getRawOne();

        return {
            total: totalSessions,
            active: activeSessions,
            completed: completedSessions,
            averageSteps: Math.round(avgSteps?.avg || 0),
        };
    }
}