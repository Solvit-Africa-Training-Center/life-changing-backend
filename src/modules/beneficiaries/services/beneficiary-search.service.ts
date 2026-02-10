// src/modules/beneficiaries/services/beneficiary-search.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Beneficiary } from '../entities/beneficiary.entity';
import { PaginationParams, PaginatedResponse } from '../../../shared/interfaces/pagination.interface';

@Injectable()
export class BeneficiarySearchService {
  constructor(
    @InjectRepository(Beneficiary)
    private beneficiariesRepository: Repository<Beneficiary>,
  ) {}

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
    this.applySorting(dataQueryBuilder, sortBy, sortOrder);

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

  private applySorting(queryBuilder: any, sortBy: string, sortOrder: 'ASC' | 'DESC'): void {
    if (sortBy === 'fullName') {
      queryBuilder.orderBy('user.fullName', sortOrder);
    } else if (sortBy === 'program.name') {
      queryBuilder.orderBy('program.name', sortOrder);
    } else if (sortBy.includes('user.')) {
      const field = sortBy.replace('user.', '');
      queryBuilder.orderBy(`user.${field}`, sortOrder);
    } else {
      queryBuilder.orderBy(`beneficiary.${sortBy}`, sortOrder);
    }
  }
}