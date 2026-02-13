import { Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository} from 'typeorm';
import { Beneficiary } from '../entities/beneficiary.entity';
import { BaseService } from '../../../shared/services/base.service';
import { PaginationParams, PaginatedResponse } from '../../../shared/interfaces/pagination.interface';
import { CreateBeneficiaryDto } from '../dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from '../dto/update-beneficiary.dto';
import { BeneficiaryStatus } from '../../../config/constants';
import { BeneficiaryStatsDto } from '../dto/beneficiary-stats.dto';
import { plainToInstance } from 'class-transformer';
import { AssignProgramDto } from '../dto/assign-program.dto';


import { BeneficiaryRegistrationService } from './beneficiary-registration.service';
import { BeneficiaryProgramService } from './beneficiary-program.service';
import { BeneficiaryQueryService } from './beneficiary-query.service';
import { BeneficiarySearchService } from './beneficiary-search.service';
import { BeneficiaryStatsService } from './beneficiary-stats.service';
import { BeneficiaryManagementService } from './beneficiary-management.service';

@Injectable()
export class BeneficiariesService extends BaseService<Beneficiary> {
  constructor(
    @InjectRepository(Beneficiary)
    private beneficiariesRepository: Repository<Beneficiary>,
    private registrationService: BeneficiaryRegistrationService,
    private programService: BeneficiaryProgramService,
    private queryService: BeneficiaryQueryService,
    private searchService: BeneficiarySearchService,
    private statsService: BeneficiaryStatsService,
    private managementService: BeneficiaryManagementService,
  ) {
    super(beneficiariesRepository);
  }

  async createBeneficiary(userId: string, createBeneficiaryDto: CreateBeneficiaryDto): Promise<Beneficiary> {
    return this.registrationService.createBeneficiary(userId, createBeneficiaryDto);
  }

  async assignProgram(beneficiaryId: string, assignProgramDto: AssignProgramDto): Promise<Beneficiary> {
    return this.programService.assignProgram(beneficiaryId, assignProgramDto);
  }

  async getUnassignedBeneficiaries(paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    return this.queryService.getUnassignedBeneficiaries(paginationParams);
  }

  async findBeneficiaryByUserId(userId: string): Promise<Beneficiary | null> {
    return this.queryService.findBeneficiaryByUserId(userId);
  }

  async findBeneficiaryById(id: string): Promise<Beneficiary | null> {
    return this.queryService.findBeneficiaryById(id);
  }


  async updateBeneficiary(beneficiaryId: string, updateBeneficiaryDto: UpdateBeneficiaryDto): Promise<Beneficiary> {
    return this.managementService.updateBeneficiary(beneficiaryId, updateBeneficiaryDto);
  }

  async updateBeneficiaryCapital(beneficiaryId: string, amount: number): Promise<void> {
    return this.managementService.updateBeneficiaryCapital(beneficiaryId, amount);
  }

  async graduateBeneficiary(beneficiaryId: string, exitDate: Date = new Date()): Promise<Beneficiary> {
    return this.managementService.graduateBeneficiary(beneficiaryId, exitDate);
  }

  async getBeneficiariesByProgram(programId: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    return this.queryService.getBeneficiariesByProgram(programId, paginationParams);
  }

  async getBeneficiariesByStatus(status: BeneficiaryStatus, paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    return this.queryService.getBeneficiariesByStatus(status, paginationParams);
  }

  async getBeneficiariesRequiringAttention(paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    return this.queryService.getBeneficiariesRequiringAttention(paginationParams);
  }

  async searchBeneficiaries(query: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    return this.searchService.searchBeneficiaries(query, paginationParams);
  }

  async getBeneficiaryStats(): Promise<BeneficiaryStatsDto> {
    return this.statsService.getBeneficiaryStats();
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
