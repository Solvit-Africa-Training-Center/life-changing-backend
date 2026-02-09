// src/modules/beneficiaries/services/weekly-tracking.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { WeeklyTracking } from '../entities/weekly-tracking.entity';
import { Beneficiary } from '../entities/beneficiary.entity';
import { User } from '../../users/entities/user.entity';
import { Staff } from '../../admin/entities/staff.entity';
import { BaseService } from '../../../shared/services/base.service';
import { PaginationParams, PaginatedResponse } from '../../../shared/interfaces/pagination.interface';
import { CreateTrackingDto, UpdateTrackingDto } from '../dto/create-tracking.dto';
import { UserType, AttendanceStatus, TaskStatus } from '../../../config/constants';

@Injectable()
export class WeeklyTrackingService extends BaseService<WeeklyTracking> {
  constructor(
    @InjectRepository(WeeklyTracking)
    private weeklyTrackingRepository: Repository<WeeklyTracking>,
    @InjectRepository(Beneficiary)
    private beneficiariesRepository: Repository<Beneficiary>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
  ) {
    super(weeklyTrackingRepository);
  }

  async createTracking(
    beneficiaryId: string,
    createTrackingDto: CreateTrackingDto,
    submittedById: string,
    submittedByType: UserType = UserType.BENEFICIARY
  ): Promise<WeeklyTracking> {
    const beneficiary = await this.beneficiariesRepository.findOne({
      where: { id: beneficiaryId },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    const submittedBy = await this.usersRepository.findOne({
      where: { id: submittedById },
    });

    if (!submittedBy) {
      throw new NotFoundException('User not found');
    }

    // Update beneficiary's current capital
    beneficiary.currentCapital = createTrackingDto.currentCapital;
    beneficiary.lastTrackingDate = new Date();
    
    // Calculate next tracking date (1 week from now)
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7);
    beneficiary.nextTrackingDate = nextDate;

    await this.beneficiariesRepository.save(beneficiary);

    const tracking = this.weeklyTrackingRepository.create({
      beneficiary,
      weekEnding: new Date(createTrackingDto.weekEnding),
      attendance: createTrackingDto.attendance,
      taskGiven: createTrackingDto.taskGiven,
      taskCompletionStatus: createTrackingDto.taskCompletionStatus,
      incomeThisWeek: createTrackingDto.incomeThisWeek,
      expensesThisWeek: createTrackingDto.expensesThisWeek,
      currentCapital: createTrackingDto.currentCapital,
      salesData: createTrackingDto.salesData,
      challenges: createTrackingDto.challenges,
      solutionsImplemented: createTrackingDto.solutionsImplemented,
      notes: createTrackingDto.notes,
      nextWeekPlan: createTrackingDto.nextWeekPlan,
      submittedBy,
      submittedByType,
      isOfflineSync: createTrackingDto.isOfflineSync || false,
      syncSessionId: createTrackingDto.syncSessionId,
      offlineData: createTrackingDto.offlineData,
      submittedAt: new Date(),
    });

    return await this.weeklyTrackingRepository.save(tracking);
  }

  async getBeneficiaryTrackings(
    beneficiaryId: string,
    paginationParams: PaginationParams
  ): Promise<PaginatedResponse<WeeklyTracking>> {
    const where: FindOptionsWhere<WeeklyTracking> = { 
      beneficiary: { id: beneficiaryId } 
    };
    return this.paginate(paginationParams, where, [
      'beneficiary', 
      'submittedBy', 
      'verifiedBy'
    ]);
  }

  async getTrackingsByDateRange(
    startDate: Date,
    endDate: Date,
    paginationParams: PaginationParams
  ): Promise<PaginatedResponse<WeeklyTracking>> {
    const where: FindOptionsWhere<WeeklyTracking> = {
      weekEnding: Between(startDate, endDate),
    };
    return this.paginate(paginationParams, where, [
      'beneficiary', 
      'submittedBy'
    ]);
  }

  async getAttendanceStats(beneficiaryId: string) {
    const stats = await this.weeklyTrackingRepository
      .createQueryBuilder('tracking')
      .select('tracking.attendance, COUNT(*) as count')
      .where('tracking.beneficiary_id = :beneficiaryId', { beneficiaryId })
      .groupBy('tracking.attendance')
      .getRawMany();

    return stats;
  }

  async verifyTracking(
    trackingId: string,
    verifiedById: string,
    notes?: string
  ): Promise<WeeklyTracking> {
    const tracking = await this.findOne(trackingId, ['verifiedBy']);
    
    if (!tracking) {
      throw new NotFoundException('Tracking not found');
    }

    const verifiedBy = await this.staffRepository.findOne({
      where: { id: verifiedById },
    });

    if (!verifiedBy) {
      throw new NotFoundException('Staff not found');
    }

    tracking.verifiedAt = new Date();
    tracking.verifiedBy = verifiedBy;
    
    if (notes) {
      tracking.notes = notes;
    }

    return await this.weeklyTrackingRepository.save(tracking);
  }

  async getRecentTrackings(beneficiaryId: string, limit: number = 5): Promise<WeeklyTracking[]> {
    return this.weeklyTrackingRepository.find({
      where: { beneficiary: { id: beneficiaryId } },
      order: { weekEnding: 'DESC' },
      take: limit,
      relations: ['submittedBy'],
    });
  }
}