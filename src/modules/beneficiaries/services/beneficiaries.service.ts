import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, IsNull, In } from 'typeorm';
import { Beneficiary } from '../entities/beneficiary.entity';
import { User } from '../../users/entities/user.entity';
import { Program } from '../../programs/entities/program.entity';
import { BaseService } from '../../../shared/services/base.service';
import { PaginationParams, PaginatedResponse } from '../../../shared/interfaces/pagination.interface';
import { CreateBeneficiaryDto } from '../dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from '../dto/update-beneficiary.dto';
import { UserType, BeneficiaryStatus, TrackingFrequency, ProgramStatus } from '../../../config/constants';
import { BeneficiaryStatsDto } from '../dto/beneficiary-stats.dto';
import { plainToInstance } from 'class-transformer';
import { AssignProgramDto } from '../dto/assign-program.dto';

@Injectable()
export class BeneficiariesService extends BaseService<Beneficiary> {
  constructor(
    @InjectRepository(Beneficiary)
    private beneficiariesRepository: Repository<Beneficiary>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Program)
    private programsRepository: Repository<Program>,
  ) {
    super(beneficiariesRepository);
  }

  async createBeneficiary(userId: string, createBeneficiaryDto: CreateBeneficiaryDto): Promise<Beneficiary> {
    // 1. Check if user exists
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Check if user already has a beneficiary profile
    const existingBeneficiary = await this.beneficiariesRepository.findOne({
      where: { user: { id: userId } },
    });

    if (existingBeneficiary) {
      throw new ConflictException('User already has a beneficiary profile');
    }

    // 3. Validate date of birth (must be at least 18 years old)
    const dateOfBirth = new Date(createBeneficiaryDto.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    if (age < 18) {
      throw new BadRequestException('Beneficiary must be at least 18 years old');
    }

    // 4. Handle program (optional)
    let program: Program | null = null;
    let enrollmentDate: Date | null = null;
    let initialStatus = BeneficiaryStatus.PENDING; // New status for "profile complete, no program"

    if (createBeneficiaryDto.programId) {
      // If program is provided, validate it
      program = await this.programsRepository.findOne({
        where: {
          id: createBeneficiaryDto.programId,
          status: In([ProgramStatus.ACTIVE, ProgramStatus.PLANNING])
        },
      });

      if (!program) {
        throw new NotFoundException('Program not found or not available for enrollment');
      }

      // Set enrollment date (default to today if not provided)
      enrollmentDate = createBeneficiaryDto.enrollmentDate
        ? new Date(createBeneficiaryDto.enrollmentDate)
        : new Date();

      // Ensure enrollment date is not in the future
      if (enrollmentDate > new Date()) {
        throw new BadRequestException('Enrollment date cannot be in the future');
      }

      // Check if program has ended (only for ACTIVE status)
      if (program.endDate && program.endDate < new Date() && program.status === ProgramStatus.ACTIVE) {
        program.status = ProgramStatus.COMPLETED;
        await this.programsRepository.save(program);
        throw new BadRequestException('This program has ended. Cannot enroll new beneficiaries.');
      }

      // Set initial status based on program
      initialStatus = program.status === ProgramStatus.PLANNING
        ? BeneficiaryStatus.WAITING
        : BeneficiaryStatus.ACTIVE;
    }

    // 5. Update user type
    if (user.userType !== UserType.BENEFICIARY) {
      user.userType = UserType.BENEFICIARY;
      await this.usersRepository.save(user);
    }

    // 6. Create beneficiary profile
    const beneficiary = this.beneficiariesRepository.create({
      user,
      program, // Can be null
      dateOfBirth,
      location: createBeneficiaryDto.location,
      status: initialStatus,
      enrollmentDate, // Can be null if no program
      startCapital: createBeneficiaryDto.startCapital || 0,
      currentCapital: createBeneficiaryDto.startCapital || 0,
      businessType: createBeneficiaryDto.businessType,
      trackingFrequency: createBeneficiaryDto.trackingFrequency || TrackingFrequency.WEEKLY,
      requiresSpecialAttention: createBeneficiaryDto.requiresSpecialAttention || false,
      profileCompletion: this.calculateProfileCompletion(createBeneficiaryDto),
    });

    const savedBeneficiary = await this.beneficiariesRepository.save(beneficiary);

    // 7. Update program funds allocated (only if program exists and startCapital > 0)
    if (program && createBeneficiaryDto.startCapital > 0) {
      await this.updateProgramFundsAllocated(program.id, createBeneficiaryDto.startCapital);
    }

    return plainToInstance(Beneficiary, savedBeneficiary);
  }

  private calculateProfileCompletion(dto: CreateBeneficiaryDto): number {
    // Define required fields for basic profile (program is optional)
    const requiredFields = [
      'dateOfBirth',
      'location',
      'startCapital',
      'businessType',
      'trackingFrequency',
    ];

    const totalFields = requiredFields.length;
    let completedFields = 0;

    // Check each required field
    if (dto.dateOfBirth) completedFields++;
    if (dto.location && dto.location.district && dto.location.sector && dto.location.cell && dto.location.village) completedFields++;
    if (dto.startCapital !== undefined && dto.startCapital !== null) completedFields++;
    if (dto.businessType) completedFields++;
    if (dto.trackingFrequency) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  }

  // Optional method to update program funds
  private async updateProgramFundsAllocated(programId: string, amount: number): Promise<void> {
    await this.programsRepository.createQueryBuilder()
      .update(Program)
      .set({
        fundsAllocated: () => `funds_allocated + ${amount}`,
      })
      .where('id = :id', { id: programId })
      .execute();
  }


  async assignProgram(beneficiaryId: string, assignProgramDto: AssignProgramDto): Promise<Beneficiary> {
    const beneficiary = await this.findOne(beneficiaryId, ['program', 'user']);

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    // Check if already has a program
    if (beneficiary.program) {
      throw new ConflictException('Beneficiary is already assigned to a program');
    }

    // Find the program
    const program = await this.programsRepository.findOne({
      where: {
        id: assignProgramDto.programId,
        status: In([ProgramStatus.ACTIVE, ProgramStatus.PLANNING])
      },
    });

    if (!program) {
      throw new NotFoundException('Program not found or not available for enrollment');
    }

    // Set enrollment date
    const enrollmentDate = assignProgramDto.enrollmentDate
      ? new Date(assignProgramDto.enrollmentDate)
      : new Date();

    // Update beneficiary
    beneficiary.program = program;
    beneficiary.enrollmentDate = enrollmentDate;
    beneficiary.status = program.status === ProgramStatus.PLANNING
      ? BeneficiaryStatus.WAITING
      : BeneficiaryStatus.ACTIVE;

    // Update profile completion (now includes program)
    beneficiary.profileCompletion = 100;

    const updatedBeneficiary = await this.beneficiariesRepository.save(beneficiary);

    // Update program funds if beneficiary has start capital
    if (beneficiary.startCapital > 0) {
      await this.updateProgramFundsAllocated(program.id, beneficiary.startCapital);
    }

    return plainToInstance(Beneficiary, updatedBeneficiary);
  }

  async getUnassignedBeneficiaries(paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    const where: FindOptionsWhere<Beneficiary> = { program: IsNull() };
    const result = await this.paginate(paginationParams, where, ['user']);

    const transformedData = result.data.map(beneficiary => plainToInstance(Beneficiary, beneficiary));

    return {
      ...result,
      data: transformedData
    };
  }

  async findBeneficiaryByUserId(userId: string): Promise<Beneficiary | null> {
    const beneficiary = await this.beneficiariesRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'program', 'weeklyTrackings', 'goals', 'documents', 'emergencyContacts'],
    });

    if (!beneficiary) return null;

    return plainToInstance(Beneficiary, beneficiary);
  }

  async updateBeneficiary(beneficiaryId: string, updateBeneficiaryDto: UpdateBeneficiaryDto): Promise<Beneficiary> {
    const beneficiary = await this.findOne(beneficiaryId, ['user', 'program']);

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    // Update program if provided
    if (updateBeneficiaryDto.programId) {
      const program = await this.programsRepository.findOne({
        where: { id: updateBeneficiaryDto.programId },
      });

      if (!program) {
        throw new NotFoundException('Program not found');
      }

      beneficiary.program = program;
      delete updateBeneficiaryDto.programId;
    }


    Object.assign(beneficiary, updateBeneficiaryDto);
    const updatedBeneficiary = await this.beneficiariesRepository.save(beneficiary);
    return plainToInstance(Beneficiary, updatedBeneficiary);
  }

  async updateBeneficiaryCapital(beneficiaryId: string, amount: number): Promise<void> {
    await this.beneficiariesRepository.update(beneficiaryId, {
      currentCapital: () => `current_capital + ${amount}`,
    });
  }

  async graduateBeneficiary(beneficiaryId: string, exitDate: Date = new Date()): Promise<Beneficiary> {
    const beneficiary = await this.findOne(beneficiaryId);

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    beneficiary.status = BeneficiaryStatus.GRADUATED;
    beneficiary.exitDate = exitDate;

    const updatedBeneficiary = await this.beneficiariesRepository.save(beneficiary);
    return plainToInstance(Beneficiary, updatedBeneficiary);
  }

  async getBeneficiariesByProgram(programId: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    const where: FindOptionsWhere<Beneficiary> = { program: { id: programId } };
    const result = await this.paginate(paginationParams, where, ['user', 'program']);

    const transformedData = result.data.map(beneficiary => plainToInstance(Beneficiary, beneficiary));

    return {
      ...result,
      data: transformedData
    };
  }

  async getBeneficiariesByStatus(status: BeneficiaryStatus, paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    const where: FindOptionsWhere<Beneficiary> = { status };
    const result = await this.paginate(paginationParams, where, ['user', 'program']);

    const transformedData = result.data.map(beneficiary => plainToInstance(Beneficiary, beneficiary));

    return {
      ...result,
      data: transformedData
    };
  }

  async getBeneficiariesRequiringAttention(paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    const where: FindOptionsWhere<Beneficiary> = { requiresSpecialAttention: true };
    const result = await this.paginate(paginationParams, where, ['user', 'program']);

    const transformedData = result.data.map(beneficiary => plainToInstance(Beneficiary, beneficiary));

    return {
      ...result,
      data: transformedData
    };
  }

  async searchBeneficiaries(query: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    const page = paginationParams.page || 1;
    const limit = paginationParams.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = paginationParams.sortBy || 'createdAt';
    const sortOrder = paginationParams.sortOrder || 'DESC';

    // Create query builder for counting
    const countQueryBuilder = this.beneficiariesRepository
      .createQueryBuilder('beneficiary')
      .leftJoin('beneficiary.user', 'user')
      .leftJoin('beneficiary.program', 'program')
      .where('LOWER(user.fullName) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(beneficiary.businessType) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere("beneficiary.location::text LIKE :query", { query: `%${query}%` })
      .orWhere('LOWER(program.name) LIKE LOWER(:query)', { query: `%${query}%` });

    // Get total count
    const total = await countQueryBuilder.getCount();

    // Create query builder for paginated results
    const dataQueryBuilder = this.beneficiariesRepository
      .createQueryBuilder('beneficiary')
      .leftJoinAndSelect('beneficiary.user', 'user')
      .leftJoinAndSelect('beneficiary.program', 'program')
      .where('LOWER(user.fullName) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(beneficiary.businessType) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere("beneficiary.location::text LIKE :query", { query: `%${query}%` })
      .orWhere('LOWER(program.name) LIKE LOWER(:query)', { query: `%${query}%` });

    // Apply sorting
    if (sortBy === 'fullName') {
      dataQueryBuilder.orderBy('user.fullName', sortOrder);
    } else if (sortBy === 'program.name') {
      dataQueryBuilder.orderBy('program.name', sortOrder);
    } else if (sortBy.includes('user.')) {
      const field = sortBy.replace('user.', '');
      dataQueryBuilder.orderBy(`user.${field}`, sortOrder);
    } else {
      dataQueryBuilder.orderBy(`beneficiary.${sortBy}`, sortOrder);
    }

    // Apply pagination
    const beneficiaries = await dataQueryBuilder
      .skip(skip)
      .take(limit)
      .getMany();

    const transformedData = beneficiaries.map(beneficiary => plainToInstance(Beneficiary, beneficiary));
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

  async getBeneficiaryStats(): Promise<BeneficiaryStatsDto> {
    const totalBeneficiaries = await this.count();

    const byStatus = await this.beneficiariesRepository
      .createQueryBuilder('beneficiary')
      .select('beneficiary.status, COUNT(*) as count')
      .groupBy('beneficiary.status')
      .getRawMany();

    const byProgram = await this.beneficiariesRepository
      .createQueryBuilder('beneficiary')
      .select('program.name, COUNT(*) as count')
      .leftJoin('beneficiary.program', 'program')
      .groupBy('program.name')
      .getRawMany();

    const totalCapitalResult = await this.beneficiariesRepository
      .createQueryBuilder('beneficiary')
      .select('SUM(beneficiary.current_capital)', 'total')
      .getRawOne();

    return {
      totalBeneficiaries,
      byStatus,
      byProgram,
      totalCapital: parseFloat(totalCapitalResult?.total || '0') || 0,
    };
  }

  async findOne(id: string, relations: string[] = []): Promise<Beneficiary | null> {
    const entity = await this.beneficiariesRepository.findOne({
      where: { id },
      relations
    });

    if (!entity) return null;

    return plainToInstance(Beneficiary, entity);
  }
}
