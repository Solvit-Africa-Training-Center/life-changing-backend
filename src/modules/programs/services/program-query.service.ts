// src/modules/programs/services/program-query.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Program } from '../entities/program.entity';
import { PaginationParams } from '../../../shared/interfaces/pagination.interface';
import { ProgramCategory, ProgramStatus } from '../../../config/constants';

@Injectable()
export class ProgramQueryService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
  ) {}

  async findPublicPrograms(
    params: PaginationParams,
    category?: ProgramCategory,
  ) {
    const where: any = {
      status: ProgramStatus.ACTIVE,
    };
    
    if (category) {
      where.category = category;
    }

    return this.paginate(params, where, ['projects']);
  }

  async findAdminPrograms(
    params: PaginationParams,
    status?: ProgramStatus,
  ) {
    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    return this.paginate(params, where, ['projects', 'beneficiaries']);
  }

  async findProgramById(id: string): Promise<Program> {
    const program = await this.programRepository.findOne({
      where: { id },
      relations: ['projects', 'beneficiaries', 'beneficiaries.user','impactMetrics', 'stories', 'donations'],
    });

    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }

    return program;
  }

  async findProgramWithBasicInfo(id: string): Promise<Program> {
    return await this.programRepository.findOneOrFail({
      where: { id },
      select: ['id', 'name', 'coverImage', 'logo', 'coverImagePublicId', 'logoPublicId'],
    });
  }

  private async paginate(
    params: PaginationParams,
    where?: any,
    relations: string[] = [],
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = params.sortBy || 'createdAt';
    const sortOrder = params.sortOrder || 'DESC';

    const [data, total] = await this.programRepository.findAndCount({
      where,
      relations,
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
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