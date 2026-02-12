// src/modules/donations/services/donations.service.ts
import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, In, LessThanOrEqual } from 'typeorm';
import { Donation } from '../entities/donation.entity';
import { RecurringDonation } from '../entities/recurring-donation.entity';
import { Donor } from '../entities/donor.entity';
import { Project } from '../../programs/entities/project.entity';
import { Program } from '../../programs/entities/program.entity';
import { BaseService } from '../../../shared/services/base.service';
import { PaginationParams, PaginatedResponse } from '../../../shared/interfaces/pagination.interface';
import { CreateDonationDto, ProcessDonationDto } from '../dto/create-donation.dto';
import { DonationType, PaymentStatus, RecurringStatus, Currency, RecurringFrequency, PaymentMethod, Language } from '../../../config/constants';
import { DonationStatsDto, RecurringDonationStatsDto } from '../dto/donation-stats.dto';
import { plainToInstance } from 'class-transformer';
import { DonorsService } from './donors.service';
import { CreateRecurringDonationDto, UpdateRecurringDonationDto } from '../dto/create-recurring-donation.dto';
import { NotificationService } from '../../notifications/services/notifications.service';
import { DonationReceiptData } from '../../donations/interfaces/donation-receipt.interface';

@Injectable()
export class DonationsService extends BaseService<Donation> {
    private readonly exchangeRates = {
        [Currency.USD]: { [Currency.RWF]: 1300 },
        [Currency.EUR]: { [Currency.RWF]: 1400 },
        [Currency.RWF]: { [Currency.USD]: 1 / 1300, [Currency.EUR]: 1 / 1400 },
    };

    private readonly logger = new Logger(DonationsService.name);

    constructor(
        @InjectRepository(Donation)
        private donationsRepository: Repository<Donation>,
        @InjectRepository(RecurringDonation)
        private recurringDonationsRepository: Repository<RecurringDonation>,
        @InjectRepository(Project)
        private projectsRepository: Repository<Project>,
        @InjectRepository(Program)
        private programsRepository: Repository<Program>,
        @Inject(forwardRef(() => DonorsService))
        private donorsService: DonorsService,
        private notificationService: NotificationService,
    ) {
        super(donationsRepository);
    }

    async processDonation(processDonationDto: ProcessDonationDto, metadata?: any): Promise<Donation> {
        // Validate donor exists
        const donor = await this.donorsService.findOne(processDonationDto.donorId, ['user']);
        if (!donor) {
            throw new NotFoundException('Donor not found');
        }
        const donationData: Partial<Donation> = {
            amount: processDonationDto.amount,
            currency: processDonationDto.currency,
            donationType: processDonationDto.donationType,
            paymentMethod: processDonationDto.paymentMethod,
            paymentStatus: PaymentStatus.PENDING,
            transactionId: this.generateTransactionId(),
            paymentDetails: {
                provider: processDonationDto.paymentMethod === PaymentMethod.CARD ? 'stripe' : 'paypack',
            },
            isAnonymous: processDonationDto.isAnonymous || false,
            donorMessage: processDonationDto.donorMessage,
            metadata: metadata || {
                ipAddress: '127.0.0.1',
                userAgent: 'test-agent',
                paymentGatewayResponse: {},
                taxReceiptEligible: true,
            },
        };

        // Create donation entity
        const donation = this.donationsRepository.create(donationData);

        // Set donor relation
        donation.donor = donor;

        // Set project relation if provided
        if (processDonationDto.projectId) {
            const project = await this.projectsRepository.findOne({
                where: { id: processDonationDto.projectId }
            });
            if (project) {
                donation.project = project;
            }
        }

        // Set program relation if provided
        if (processDonationDto.programId) {
            const program = await this.programsRepository.findOne({
                where: { id: processDonationDto.programId }
            });
            if (program) {
                donation.program = program;
            }
        }
        const savedDonation = await this.donationsRepository.save(donation);

        // In real implementation, you would:
        // 1. Call payment gateway API
        // 2. Process payment
        // 3. Update donation status based on response
        // 4. Send receipt if successful

        return plainToInstance(Donation, savedDonation);
    }

    async confirmDonation(transactionId: string, paymentDetails: any): Promise<Donation> {
        const donation = await this.donationsRepository.findOne({
            where: { transactionId },
            relations: ['donor'],
        });

        if (!donation) {
            throw new NotFoundException('Donation not found');
        }

        // Update payment status
        donation.paymentStatus = PaymentStatus.COMPLETED;
        donation.paymentDetails = {
            ...donation.paymentDetails,
            ...paymentDetails,
        };

        const updatedDonation = await this.donationsRepository.save(donation);

        // Update donor's total
        await this.donorsService.updateDonorTotal(donation.donor.id, donation.amount);

        // Send receipt (would be async in production)
        await this.sendReceipt(updatedDonation);

        return plainToInstance(Donation, updatedDonation);
    }

    async createRecurringDonation(
        donorId: string,
        createRecurringDonationDto: CreateRecurringDonationDto
    ): Promise<RecurringDonation> {
        const donor = await this.donorsService.findOne(donorId, ['user']);
        if (!donor) {
            throw new NotFoundException('Donor not found');
        }

        // Create recurring donation data
        const recurringDonationData: Partial<RecurringDonation> = {
            amount: createRecurringDonationDto.amount,
            currency: createRecurringDonationDto.currency,
            frequency: createRecurringDonationDto.frequency,
            paymentMethodId: createRecurringDonationDto.paymentMethodId,
            paymentMethodDetails: createRecurringDonationDto.paymentMethodDetails,
            subscriptionId: createRecurringDonationDto.subscriptionId,
            nextChargeDate: this.calculateNextChargeDate(createRecurringDonationDto.frequency),
            startDate: createRecurringDonationDto.startDate || new Date(),
            endDate: createRecurringDonationDto.endDate,
            sendReminders: createRecurringDonationDto.sendReminders || false,
            status: RecurringStatus.ACTIVE,
        };

        // Create recurring donation entity
        const recurringDonation = this.recurringDonationsRepository.create(recurringDonationData);

        // Set donor relation
        recurringDonation.donor = donor;

        // Set project relation if provided
        if (createRecurringDonationDto.projectId) {
            const project = await this.projectsRepository.findOne({
                where: { id: createRecurringDonationDto.projectId }
            });
            if (project) {
                recurringDonation.project = project;
            }
        }

        // Set program relation if provided
        if (createRecurringDonationDto.programId) {
            const program = await this.programsRepository.findOne({
                where: { id: createRecurringDonationDto.programId }
            });
            if (program) {
                recurringDonation.program = program;
            }
        }

        const savedRecurringDonation = await this.recurringDonationsRepository.save(recurringDonation);

        // Update donor's recurring status
        if (!donor.isRecurringDonor) {
            donor.isRecurringDonor = true;
            await this.donorsService['donorsRepository'].save(donor);
        }
        return plainToInstance(RecurringDonation, savedRecurringDonation);
    }

    async processRecurringCharges(): Promise<void> {
        const today = new Date();
        const recurringDonations = await this.recurringDonationsRepository.find({
            where: {
                status: RecurringStatus.ACTIVE,
                nextChargeDate: LessThanOrEqual(today),
            },
            relations: ['donor', 'project', 'program'], // Added relations here
        });

        for (const recurringDonation of recurringDonations) {
            try {
                // Process charge
                await this.processRecurringCharge(recurringDonation);

                // Update next charge date
                recurringDonation.nextChargeDate = this.calculateNextChargeDate(
                    recurringDonation.frequency,
                    recurringDonation.nextChargeDate
                );
                recurringDonation.lastChargedDate = today;
                recurringDonation.totalCharges += 1;
                recurringDonation.totalAmount += recurringDonation.amount;

                await this.recurringDonationsRepository.save(recurringDonation);
            } catch (error) {
                console.error(`Failed to process recurring charge for ${recurringDonation.id}:`, error);
                // Implement retry logic or mark as failed
            }
        }
    }

    async getDonationsByDonor(donorId: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Donation>> {
        const where: FindOptionsWhere<Donation> = { donor: { id: donorId } };
        const result = await this.paginate(paginationParams, where, ['donor', 'project', 'program']);

        const transformedData = result.data.map(donation => plainToInstance(Donation, donation));

        return {
            ...result,
            data: transformedData
        };
    }

    async getRecurringDonationsByDonor(donorId: string, paginationParams: PaginationParams): Promise<PaginatedResponse<RecurringDonation>> {
        const page = paginationParams.page || 1;
        const limit = paginationParams.limit || 20;
        const skip = (page - 1) * limit;
        const sortBy = paginationParams.sortBy || 'createdAt';
        const sortOrder = paginationParams.sortOrder || 'DESC';

        const [recurringDonations, total] = await this.recurringDonationsRepository.findAndCount({
            where: { donor: { id: donorId } },
            relations: ['donor', 'project', 'program'],
            order: { [sortBy]: sortOrder },
            skip,
            take: limit,
        });

        const totalPages = Math.ceil(total / limit);

        return {
            data: recurringDonations.map(rd => plainToInstance(RecurringDonation, rd)),
            meta: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    async getDonationsByProgram(programId: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Donation>> {
        const where: FindOptionsWhere<Donation> = { program: { id: programId } };
        const result = await this.paginate(paginationParams, where, ['donor', 'program']);

        const transformedData = result.data.map(donation => plainToInstance(Donation, donation));

        return {
            ...result,
            data: transformedData
        };
    }

    async getDonationsByProject(projectId: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Donation>> {
        const where: FindOptionsWhere<Donation> = { project: { id: projectId } };
        const result = await this.paginate(paginationParams, where, ['donor', 'project']);

        const transformedData = result.data.map(donation => plainToInstance(Donation, donation));

        return {
            ...result,
            data: transformedData
        };
    }

    async updateRecurringDonation(
        recurringDonationId: string,
        updateDto: UpdateRecurringDonationDto
    ): Promise<RecurringDonation> {
        const recurringDonation = await this.recurringDonationsRepository.findOne({
            where: { id: recurringDonationId },
            relations: ['donor'],
        });

        if (!recurringDonation) {
            throw new NotFoundException('Recurring donation not found');
        }

        Object.assign(recurringDonation, updateDto);
        const updatedRecurringDonation = await this.recurringDonationsRepository.save(recurringDonation);

        return plainToInstance(RecurringDonation, updatedRecurringDonation);
    }

    async cancelRecurringDonation(recurringDonationId: string, reason: string): Promise<RecurringDonation> {
        const recurringDonation = await this.recurringDonationsRepository.findOne({
            where: { id: recurringDonationId },
            relations: ['donor'],
        });

        if (!recurringDonation) {
            throw new NotFoundException('Recurring donation not found');
        }

        recurringDonation.status = RecurringStatus.CANCELLED;
        recurringDonation.cancellationReason = reason;
        recurringDonation.endDate = new Date();

        const cancelledRecurringDonation = await this.recurringDonationsRepository.save(recurringDonation);

        return plainToInstance(RecurringDonation, cancelledRecurringDonation);
    }

    async getDonationStats(): Promise<DonationStatsDto> {
        const totalDonations = await this.count();

        const totalAmountResult = await this.donationsRepository
            .createQueryBuilder('donation')
            .select('SUM(donation.amount)', 'total')
            .where('donation.paymentStatus = :status', { status: PaymentStatus.COMPLETED })
            .getRawOne();

        const byType = await this.donationsRepository
            .createQueryBuilder('donation')
            .select('donation.donationType, COUNT(*) as count, SUM(donation.amount) as amount')
            .where('donation.paymentStatus = :status', { status: PaymentStatus.COMPLETED })
            .groupBy('donation.donationType')
            .getRawMany();

        const recurringCount = await this.recurringDonationsRepository.count({
            where: { status: RecurringStatus.ACTIVE },
        });

        // Get stats by program
        const byProgram = await this.donationsRepository
            .createQueryBuilder('donation')
            .leftJoin('donation.program', 'program')
            .select('program.name, COUNT(*) as count, SUM(donation.amount) as amount')
            .where('donation.paymentStatus = :status', { status: PaymentStatus.COMPLETED })
            .andWhere('donation.program IS NOT NULL')
            .groupBy('program.name')
            .getRawMany();

        // Get monthly stats for current year
        const currentYear = new Date().getFullYear();
        const byMonth = await this.donationsRepository
            .createQueryBuilder('donation')
            .select("TO_CHAR(donation.createdAt, 'YYYY-MM') as month, COUNT(*) as count, SUM(donation.amount) as amount")
            .where('donation.paymentStatus = :status', { status: PaymentStatus.COMPLETED })
            .andWhere('EXTRACT(YEAR FROM donation.createdAt) = :year', { year: currentYear })
            .groupBy("TO_CHAR(donation.createdAt, 'YYYY-MM')")
            .orderBy('month')
            .getRawMany();

        // Calculate averages
        const averageResult = await this.donationsRepository
            .createQueryBuilder('donation')
            .select('AVG(donation.amount)', 'average')
            .addSelect('donation.donationType', 'type')
            .where('donation.paymentStatus = :status', { status: PaymentStatus.COMPLETED })
            .groupBy('donation.donationType')
            .getRawMany();

        const averages = averageResult.reduce((acc, curr) => {
            acc[curr.type.toLowerCase()] = parseFloat(curr.average) || 0;
            return acc;
        }, {});

        return {
            totalDonations,
            totalAmount: parseFloat(totalAmountResult?.total || '0') || 0,
            recurringDonations: recurringCount,
            byType,
            byProgram,
            byMonth,
            averageDonation: {
                oneTime: averages[DonationType.ONE_TIME.toLowerCase()] || 0,
                recurring: averages[DonationType.MONTHLY.toLowerCase()] || 0,
                overall: parseFloat(totalAmountResult?.total || '0') / totalDonations || 0,
            },
        };
    }

    async getRecurringDonationStats(): Promise<RecurringDonationStatsDto> {
        const totalActive = await this.recurringDonationsRepository.count({
            where: { status: RecurringStatus.ACTIVE },
        });

        const totalPaused = await this.recurringDonationsRepository.count({
            where: { status: RecurringStatus.PAUSED },
        });

        const totalCancelled = await this.recurringDonationsRepository.count({
            where: { status: RecurringStatus.CANCELLED },
        });

        const monthlyRevenue = await this.recurringDonationsRepository
            .createQueryBuilder('recurring')
            .select('SUM(recurring.amount)', 'mrr')
            .where('recurring.status = :status', { status: RecurringStatus.ACTIVE })
            .getRawOne();

        const byFrequency = await this.recurringDonationsRepository
            .createQueryBuilder('recurring')
            .select('recurring.frequency, COUNT(*) as count, SUM(recurring.amount) as amount')
            .where('recurring.status = :status', { status: RecurringStatus.ACTIVE })
            .groupBy('recurring.frequency')
            .getRawMany();

        // Get upcoming charges (next 30 days)
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

        const upcomingChargesResult = await this.recurringDonationsRepository
            .createQueryBuilder('recurring')
            .select('COUNT(*) as count, SUM(recurring.amount) as amount')
            .where('recurring.status = :status', { status: RecurringStatus.ACTIVE })
            .andWhere('recurring.nextChargeDate BETWEEN :today AND :future', {
                today: new Date(),
                future: thirtyDaysLater,
            })
            .getRawOne();

        return {
            totalActive,
            totalPaused,
            totalCancelled,
            monthlyRecurringRevenue: parseFloat(monthlyRevenue?.mrr || '0') || 0,
            byFrequency,
            upcomingCharges: [{
                count: parseInt(upcomingChargesResult?.count || '0'),
                amount: parseFloat(upcomingChargesResult?.amount || '0'),
            }],
        };
    }

    async searchDonations(query: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Donation>> {
        const page = paginationParams.page || 1;
        const limit = paginationParams.limit || 20;
        const skip = (page - 1) * limit;
        const sortBy = paginationParams.sortBy || 'createdAt';
        const sortOrder = paginationParams.sortOrder || 'DESC';

        const countQueryBuilder = this.donationsRepository
            .createQueryBuilder('donation')
            .leftJoin('donation.donor', 'donor')
            .leftJoin('donation.project', 'project')
            .leftJoin('donation.program', 'program')
            .leftJoin('donor.user', 'user')
            .where('LOWER(user.fullName) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('donation.transactionId LIKE :query', { query: `%${query}%` })
            .orWhere('LOWER(project.name) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(program.name) LIKE LOWER(:query)', { query: `%${query}%` });

        const total = await countQueryBuilder.getCount();

        const dataQueryBuilder = this.donationsRepository
            .createQueryBuilder('donation')
            .leftJoinAndSelect('donation.donor', 'donor')
            .leftJoinAndSelect('donation.project', 'project')
            .leftJoinAndSelect('donation.program', 'program')
            .leftJoinAndSelect('donor.user', 'user')
            .where('LOWER(user.fullName) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('donation.transactionId LIKE :query', { query: `%${query}%` })
            .orWhere('LOWER(project.name) LIKE LOWER(:query)', { query: `%${query}%` })
            .orWhere('LOWER(program.name) LIKE LOWER(:query)', { query: `%${query}%` });

        if (sortBy === 'donorName') {
            dataQueryBuilder.orderBy('user.fullName', sortOrder);
        } else if (sortBy === 'project.name') {
            dataQueryBuilder.orderBy('project.name', sortOrder);
        } else if (sortBy === 'program.name') {
            dataQueryBuilder.orderBy('program.name', sortOrder);
        } else {
            dataQueryBuilder.orderBy(`donation.${sortBy}`, sortOrder);
        }

        const donations = await dataQueryBuilder
            .skip(skip)
            .take(limit)
            .getMany();

        const transformedData = donations.map(donation => plainToInstance(Donation, donation));
        const totalPages = Math.ceil(total / limit);

        return {
            data: transformedData,
            meta: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        };
    }

    private calculateLocalAmount(amount: number, currency: Currency): { localAmount: number; exchangeRate: number } {
        const exchangeRate = this.exchangeRates[currency]?.[Currency.RWF] || 1;
        const localAmount = amount * exchangeRate;

        return {
            localAmount: parseFloat(localAmount.toFixed(2)),
            exchangeRate: parseFloat(exchangeRate.toFixed(4)),
        };
    }

    private generateTransactionId(): string {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `TX${timestamp}${random}`;
    }

    private calculateNextChargeDate(frequency: RecurringFrequency, fromDate: Date = new Date()): Date {
        const nextDate = new Date(fromDate);

        switch (frequency) {
            case RecurringFrequency.MONTHLY:
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case RecurringFrequency.QUARTERLY:
                nextDate.setMonth(nextDate.getMonth() + 3);
                break;
            case RecurringFrequency.YEARLY:
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
        }

        return nextDate;
    }

    private async createDonationFromRecurring(recurringDonation: RecurringDonation): Promise<Donation> {
        const transactionId = this.generateTransactionId();

        // Calculate local amount
        const { localAmount, exchangeRate } = this.calculateLocalAmount(
            recurringDonation.amount,
            recurringDonation.currency as Currency
        );

        // Get card details safely
        const cardLast4 = recurringDonation.paymentMethodDetails?.last4 || '4242';
        const cardBrand = recurringDonation.paymentMethodDetails?.brand || 'visa';

        // Create donation data
        const donationData: Partial<Donation> = {
            amount: recurringDonation.amount,
            currency: recurringDonation.currency as Currency,
            localAmount,
            exchangeRate,
            donationType: DonationType.MONTHLY,
            paymentMethod: PaymentMethod.CARD,
            paymentStatus: PaymentStatus.COMPLETED,
            transactionId,
            paymentDetails: {
                provider: 'stripe',
                cardLast4,
                cardBrand,
            },
            isAnonymous: recurringDonation.donor.anonymityPreference,
            metadata: {
                ipAddress: '127.0.0.1', // Required fields from Donation entity
                userAgent: 'recurring-charge',
                paymentGatewayResponse: { success: true },
                taxReceiptEligible: true,
            },
        };

        // Create donation
        const donation = this.donationsRepository.create(donationData);

        // Set relations
        donation.donor = recurringDonation.donor;
        if (recurringDonation.project) {
            donation.project = recurringDonation.project;
        }
        if (recurringDonation.program) {
            donation.program = recurringDonation.program;
        }

        return await this.donationsRepository.save(donation);
    }

    private async processRecurringCharge(recurringDonation: RecurringDonation): Promise<void> {
        try {
            // Create donation from recurring
            const donation = await this.createDonationFromRecurring(recurringDonation);

            // Update donor total
            await this.donorsService.updateDonorTotal(recurringDonation.donor.id, recurringDonation.amount);

            // Send receipt
            await this.sendReceipt(donation);

        } catch (error) {
            console.error(`Failed to process recurring charge for ${recurringDonation.id}:`, error);
            throw error;
        }
    }

    // In your donations.service.ts, update the sendReceipt method:

    private async sendReceipt(donation: Donation): Promise<void> {
        try {
            const donor = donation.donor;

            if (!donor || !donor.user) {
                this.logger.warn('Cannot send receipt: donor or user information missing');
                return;
            }

            // Generate receipt number
            const receiptNumber = `REC-${donation.id.substring(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`;

            // Update donation with receipt info
            donation.receiptSent = true;
            donation.receiptSentAt = new Date();
            donation.receiptNumber = receiptNumber;
            await this.donationsRepository.save(donation);

            // Send in-app notification
            await this.notificationService.sendDonationReceiptNotification(
                donor.user.id,
                donation.id,
                donation.amount,
                donation.currency,
                donation.project?.name?.en || donation.program?.name?.en || 'LCEO Project',
                donor.user.language || Language.EN
            );

            // Send email receipt if donor has email and is not anonymous
            if (donor.user.email && !donation.isAnonymous) {
                await this.sendEmailReceipt(donation);
            }

            // Send SMS receipt if donor has phone and is not anonymous
            if (donor.user.phone && !donation.isAnonymous) {
                await this.sendSMSReceipt(donation);
            }

            this.logger.log(`Receipt sent for donation ${donation.id}`);
        } catch (error) {
            this.logger.error('Failed to send receipt:', error);
        }
    }

    private async sendEmailReceipt(donation: Donation): Promise<void> {
        const donor = donation.donor;
        if (!donor?.user) {
            this.logger.warn('Cannot send email receipt: donor or user information missing');
            return;
        }

        const project = donation.project;
        const program = donation.program;
        const language = donor.user.language || Language.EN;

        const email = donor.user.email;
        if (!email) {
            this.logger.warn('Cannot send email receipt: donor email is missing');
            return;
        }

        const receiptData: DonationReceiptData = {
            receiptNumber: donation.receiptNumber!,
            donationDate: this.formatDate(donation.createdAt, language),
            donorName: donor.user.fullName,
            amount: donation.amount,
            currency: donation.currency,
            localAmount: donation.localAmount,
            localCurrency: Currency.RWF,
            paymentMethod: this.formatPaymentMethod(donation.paymentMethod, language),
            transactionId: donation.transactionId,
            projectName: project?.name?.[language] || program?.name?.[language] ||
                (language === Language.RW ? 'Umushinga wa LCEO' : 'LCEO Project'),
            programName: program?.name?.[language] ||
                (language === Language.RW ? 'Porogaramu ya LCEO' : 'LCEO Program'),
            donorMessage: donation.donorMessage,
            isAnonymous: donation.isAnonymous,
            taxReceiptEligible: donation.metadata?.taxReceiptEligible || false,
            language,
        };

        await this.notificationService.sendDonationReceiptEmail(email, receiptData);
    }

    private formatDate(date: Date, language: Language): string {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        const locale = language === Language.RW ? 'rw-RW' : 'en-US';
        return date.toLocaleDateString(locale, options);
    }

    private formatPaymentMethod(paymentMethod: PaymentMethod, language: Language): string {
        const translations = {
            [Language.EN]: {
                [PaymentMethod.CARD]: 'Credit/Debit Card',
                [PaymentMethod.MTN_MOBILE_MONEY]: 'Mtn Mobile Money',
                [PaymentMethod.AIRTEL_MONEY]: 'Airtel Money',
                [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
            },
            [Language.RW]: {
                [PaymentMethod.CARD]: 'Ikarita y\'inguzanyo',
                [PaymentMethod.MTN_MOBILE_MONEY]: 'Mtn Mobile Money',
                [PaymentMethod.AIRTEL_MONEY]: 'Airtel Money',
                [PaymentMethod.BANK_TRANSFER]: 'Koheranyo mu banki',
            }
        };

        return translations[language]?.[paymentMethod] || paymentMethod;
    }
    private async sendSMSReceipt(donation: Donation): Promise<void> {
        const donor = donation.donor;
        const language = donor.user.language || Language.EN;

        const message = language === Language.RW
            ? `Murakoze donation ya ${donation.amount} ${donation.currency} kuri LCEO. Receipt #${donation.receiptNumber}. Inkunga yawe irimo guhindura ubuzima!`
            : `Thank you for your donation of ${donation.amount} ${donation.currency} to LCEO. Receipt #${donation.receiptNumber}. Your support is changing lives!`;

        await this.notificationService.sendDonationReceiptSMS(donor.user.phone, message);
    }

    // Also update the notifyRecurringDonationFailure method:

    private async notifyRecurringDonationFailure(recurringDonation: RecurringDonation): Promise<void> {
        try {
            const donor = recurringDonation.donor;

            if (!donor?.user) return;

            // Send in-app notification
            await this.notificationService.sendRecurringDonationFailureNotification(
                donor.user.id,
                recurringDonation.amount,
                recurringDonation.currency,
                recurringDonation.frequency,
                donor.user.language || Language.EN
            );

            // Send email notification
            if (donor.user.email) {
                await this.notificationService.sendRecurringDonationFailedEmail(
                    donor.user.email,
                    donor.user.fullName || 'Valued Donor',
                    recurringDonation.amount,
                    recurringDonation.currency,
                    recurringDonation.frequency,
                    donor.user.language || Language.EN
                );
            }

            this.logger.log(`Recurring donation failure notification sent for ${recurringDonation.id}`);
        } catch (error) {
            this.logger.error('Failed to send recurring donation failure notification:', error);
        }
    }

    async findOne(id: string, relations: string[] = []): Promise<Donation | null> {
        const entity = await this.donationsRepository.findOne({
            where: { id },
            relations
        });

        if (!entity) return null;

        return plainToInstance(Donation, entity);
    }
}