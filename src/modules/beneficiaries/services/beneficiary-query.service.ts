// src/modules/beneficiaries/services/beneficiary-query.service.ts
import { Injectable } from '@nestjs/common';
import { Repository, FindOptionsWhere, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Beneficiary } from '../entities/beneficiary.entity';
import { PaginationParams, PaginatedResponse } from '../../../shared/interfaces/pagination.interface';
import { BeneficiaryStatus } from '../../../config/constants';

@Injectable()
export class BeneficiaryQueryService {
  constructor(
    @InjectRepository(Beneficiary)
    private beneficiariesRepository: Repository<Beneficiary>,
  ) {}

  async getUnassignedBeneficiaries(paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    const where: FindOptionsWhere<Beneficiary> = { program: IsNull() };
    return this.paginateWithRelations(paginationParams, where, ['user']);
  }

  async getBeneficiariesByProgram(programId: string, paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    const where: FindOptionsWhere<Beneficiary> = { program: { id: programId } };
    return this.paginateWithRelations(paginationParams, where, ['user', 'program']);
  }

  async getBeneficiariesByStatus(status: BeneficiaryStatus, paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    const where: FindOptionsWhere<Beneficiary> = { status };
    return this.paginateWithRelations(paginationParams, where, ['user', 'program']);
  }

  async getBeneficiariesRequiringAttention(paginationParams: PaginationParams): Promise<PaginatedResponse<Beneficiary>> {
    const where: FindOptionsWhere<Beneficiary> = { requiresSpecialAttention: true };
    return this.paginateWithRelations(paginationParams, where, ['user', 'program']);
  }

  async findBeneficiaryByUserId(userId: string): Promise<Beneficiary | null> {
    const beneficiary = await this.beneficiariesRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'program', 'weeklyTrackings', 'goals', 'documents', 'emergencyContacts'],
    });

    if (!beneficiary) return null;

    return plainToInstance(Beneficiary, beneficiary);
  }

   async findBeneficiaryById(id: string): Promise<Beneficiary | null> {
      const beneficiary = await this.beneficiariesRepository.findOne({
      where: { id },
      relations: ['user', 'program', 'weeklyTrackings', 'goals', 'documents', 'emergencyContacts'],
    });

    if (!beneficiary) return null;

    return plainToInstance(Beneficiary, beneficiary);
  }

  private async paginateWithRelations(
    paginationParams: PaginationParams,
    where: FindOptionsWhere<Beneficiary>,
    relations: string[] = []
  ): Promise<PaginatedResponse<Beneficiary>> {
    const page = paginationParams.page || 1;
    const limit = paginationParams.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = paginationParams.sortBy || 'createdAt';
    const sortOrder = paginationParams.sortOrder || 'DESC';

    const [data, total] = await this.beneficiariesRepository.findAndCount({
      where,
      relations,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const transformedData = data.map(beneficiary => plainToInstance(Beneficiary, beneficiary));

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
}