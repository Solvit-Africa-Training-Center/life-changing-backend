// src/modules/beneficiaries/services/beneficiaries.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Beneficiary } from '../entities/beneficiary.entity';
import { User } from '../../users/entities/user.entity';
import { Program } from '../../programs/entities/program.entity';
import { BaseService } from '../../../shared/services/base.service';
import { PaginationParams, PaginatedResponse } from '../../../shared/interfaces/pagination.interface';
import { CreateBeneficiaryDto } from '../dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from '../dto/update-beneficiary.dto';
import { UserType, BeneficiaryStatus } from '../../../config/constants';

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
    // Check if user exists
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has a beneficiary profile
    const existingBeneficiary = await this.beneficiariesRepository.findOne({
      where: { user: { id: userId } },
    });

    if (existingBeneficiary) {
      throw new ConflictException('User already has a beneficiary profile');
    }

    // Check if program exists
    const program = await this.programsRepository.findOne({
      where: { id: createBeneficiaryDto.programId },
    });

    if (!program) {
      throw new NotFoundException('Program not found');
    }

    // Update user type
    user.userType = UserType.BENEFICIARY;
    await this.usersRepository.save(user);

    // Parse dates
    const beneficiaryData: any = { ...createBeneficiaryDto };
    beneficiaryData.dateOfBirth = new Date(createBeneficiaryDto.dateOfBirth);
    beneficiaryData.enrollmentDate = new Date(createBeneficiaryDto.enrollmentDate);
    beneficiaryData.currentCapital = createBeneficiaryDto.startCapital;

    // Create beneficiary profile
    const beneficiary = this.beneficiariesRepository.create({
      user,
      program,
      ...beneficiaryData,
    });

    return await this.beneficiariesRepository.save(beneficiary);
  }

  async findBeneficiaryByUserId(userId: string): Promise<Beneficiary | null> {
    return this.beneficiariesRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'program', 'weeklyTrackings', 'goals', 'documents', 'emergencyContacts'],
    });
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
    return await this.beneficiariesRepository.save(beneficiary);
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
    
    return await this.beneficiariesRepository.save(beneficiary);
  }

  async getBeneficiariesByProgram(programId: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    const where: FindOptionsWhere<Beneficiary> = { program: { id: programId } };
    return this.paginate(paginationParams, where, ['user', 'program']);
  }

  async getBeneficiariesByStatus(status: BeneficiaryStatus, paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    const where: FindOptionsWhere<Beneficiary> = { status };
    return this.paginate(paginationParams, where, ['user', 'program']);
  }

  async getBeneficiariesRequiringAttention(paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    const where: FindOptionsWhere<Beneficiary> = { requiresSpecialAttention: true };
    return this.paginate(paginationParams, where, ['user', 'program']);
  }

  async searchBeneficiaries(query: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    const where: FindOptionsWhere<Beneficiary>[] = [
      { fullName: query },
      { businessType: query },
      { location: { district: query } },
      { location: { sector: query } },
    ];

    return this.paginate(paginationParams, where.length > 0 ? where : undefined, ['user', 'program']);
  }

  async getBeneficiaryStats(): Promise<any> {
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

    const totalCapital = await this.beneficiariesRepository
      .createQueryBuilder('beneficiary')
      .select('SUM(beneficiary.current_capital)', 'total')
      .getRawOne();

    return {
      totalBeneficiaries,
      byStatus,
      byProgram,
      totalCapital: parseFloat(totalCapital.total) || 0,
    };
  }
}
