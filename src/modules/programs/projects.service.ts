import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { PaginationParams, PaginatedResponse } from '../../shared/interfaces/pagination.interface';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async findProjectsByProgram(
    programId: string,
    params: PaginationParams,
  ): Promise<PaginatedResponse<Project>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const sortBy = params.sortBy ?? 'createdAt';
    const sortOrder = params.sortOrder ?? 'DESC';

    const [data, total] = await this.projectRepository.findAndCount({
      where: {
        program: { id: programId },
      },
      relations: ['program', 'donations'],
      order: {
        [sortBy]: sortOrder,
      },
      take: limit,
      skip,
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
