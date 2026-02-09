// src/modules/donations/services/donations.service.ts
import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
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
import { DonationType, PaymentStatus, RecurringStatus, Currency, RecurringFrequency } from '../../../config/constants';
import { DonationStatsDto, RecurringDonationStatsDto } from '../dto/donation-stats.dto';
import { plainToInstance } from 'class-transformer';
import { DonorsService } from './donors.service';
import { CreateRecurringDonationDto, UpdateRecurringDonationDto } from '../dto/create-recurring-donation.dto';

@Injectable()
export class DonationsService extends BaseService<Donation> {
  private readonly exchangeRates = {
    [Currency.USD]: { [Currency.RWF]: 1300 },
    [Currency.EUR]: { [Currency.RWF]: 1400 },
    [Currency.RWF]: { [Currency.USD]: 1/1300, [Currency.EUR]: 1/1400 },
  };

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
  ) {
    super(donationsRepository);
  }

  async processDonation(processDonationDto: ProcessDonationDto, metadata?: any): Promise<Donation> {
    // Validate donor exists
    const donor = await this.donorsService.findOne(processDonationDto.donorId, ['user']);
    if (!donor) {
      throw new NotFoundException('Donor not found');
    }

    // Validate project/program if provided
    if (processDonationDto.projectId) {
      const project = await this.projectsRepository.findOne({ where: { id: processDonationDto.projectId } });
      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    if (processDonationDto.programId) {
      const program = await this.programsRepository.findOne({ where: { id: processDonationDto.programId } });
      if (!program) {
        throw new NotFoundException('Program not found');
      }
    }

    // Calculate exchange rate and local amount
    const { localAmount, exchangeRate } = this.calculateLocalAmount(
      processDonationDto.amount,
      processDonationDto.currency
    );

    // Generate transaction ID
    const transactionId = this.generateTransactionId();

    // Create donation record
    const donation = this.donationsRepository.create({
      donor,
      amount: processDonationDto.amount,
      currency: processDonationDto.currency,
      localAmount,
      exchangeRate,
      donationType: processDonationDto.donationType,
      project: processDonationDto.projectId ? { id: processDonationDto.projectId } : null,
      program: processDonationDto.programId ? { id: processDonationDto.programId } : null,
      paymentMethod: processDonationDto.paymentMethod,
      paymentStatus: PaymentStatus.PENDING, // Will be updated by webhook
      transactionId,
      paymentDetails: {
        provider: 'stripe', // or your payment provider
        ...(processDonationDto.paymentMethod === 'card' && { cardLast4: '4242' }), // Example
      },
      isAnonymous: processDonationDto.isAnonymous || false,
      donorMessage: processDonationDto.donorMessage,
      metadata: metadata || {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        paymentGatewayResponse: {},
        taxReceiptEligible: true,
      },
    });

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

    // Validate project/program if provided
    if (createRecurringDonationDto.projectId) {
      const project = await this.projectsRepository.findOne({ where: { id: createRecurringDonationDto.projectId } });
      if (!project) {
        throw new NotFoundException('Project not found');
      }
    }

    if (createRecurringDonationDto.programId) {
      const program = await this.programsRepository.findOne({ where: { id: createRecurringDonationDto.programId } });
      if (!program) {
        throw new NotFoundException('Program not found');
      }
    }

    // Calculate next charge date based on frequency
    const nextChargeDate = this.calculateNextChargeDate(createRecurringDonationDto.frequency);

    // Create recurring donation
    const recurringDonation = this.recurringDonationsRepository.create({
      donor,
      amount: createRecurringDonationDto.amount,
      currency: createRecurringDonationDto.currency,
      frequency: createRecurringDonationDto.frequency,
      project: createRecurringDonationDto.projectId ? { id: createRecurringDonationDto.projectId } : null,
      program: createRecurringDonationDto.programId ? { id: createRecurringDonationDto.programId } : null,
      paymentMethodId: createRecurringDonationDto.paymentMethodId,
      paymentMethodDetails: createRecurringDonationDto.paymentMethodDetails,
      subscriptionId: createRecurringDonationDto.subscriptionId,
      nextChargeDate,
      startDate: createRecurringDonationDto.startDate || new Date(),
      endDate: createRecurringDonationDto.endDate,
      sendReminders: createRecurringDonationDto.sendReminders || false,
      status: RecurringStatus.ACTIVE,
    });

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
      relations: ['donor'],
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

  private async processRecurringCharge(recurringDonation: RecurringDonation): Promise<void> {
    // In a real implementation, this would:
    // 1. Call payment gateway API to charge the card
    // 2. Create a donation record for the charge
    // 3. Update donor total
    // 4. Send receipt
    
    const transactionId = this.generateTransactionId();
    
    const donation = this.donationsRepository.create({
      donor: recurringDonation.donor,
      amount: recurringDonation.amount,
      currency: recurringDonation.currency,
      localAmount: recurringDonation.amount * (this.exchangeRates[recurringDonation.currency]?.[Currency.RWF] || 1),
      exchangeRate: this.exchangeRates[recurringDonation.currency]?.[Currency.RWF] || 1,
      donationType: DonationType.MONTHLY,
      project: recurringDonation.project,
      program: recurringDonation.program,
      paymentMethod: 'card', // Assuming card for recurring
      paymentStatus: PaymentStatus.COMPLETED,
      transactionId,
      paymentDetails: {
        provider: 'stripe',
        cardLast4: recurringDonation.paymentMethodDetails.last4,
        cardBrand: recurringDonation.paymentMethodDetails.brand,
      },
      isAnonymous: recurringDonation.donor.anonymityPreference,
      metadata: {
        recurringDonationId: recurringDonation.id,
        subscriptionId: recurringDonation.subscriptionId,
        paymentGatewayResponse: { success: true },
        taxReceiptEligible: true,
      },
    });

    await this.donationsRepository.save(donation);
    
    // Update donor total
    await this.donorsService.updateDonorTotal(recurringDonation.donor.id, recurringDonation.amount);
  }

  private async sendReceipt(donation: Donation): Promise<void> {
    // In a real implementation, this would:
    // 1. Generate receipt PDF
    // 2. Send email with receipt
    // 3. Update donation record
    
    donation.receiptSent = true;
    donation.receiptSentAt = new Date();
    donation.receiptNumber = `REC-${donation.transactionId}`;
    
    await this.donationsRepository.save(donation);
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