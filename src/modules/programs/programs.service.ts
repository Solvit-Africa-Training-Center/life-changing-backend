import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { BaseService } from '../../shared/services/base.service';
import { Program } from './entities/program.entity';
import { PaginationParams, PaginatedResponse } from '../../shared/interfaces/pagination.interface';
import { ProgramCategory, ProgramStatus } from '../../config/constants';

@Injectable()
export class ProgramsService extends BaseService<Program> {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
  ) {
    super(programRepository);
  }

  // ---------- PUBLIC ----------
  async findPublicPrograms(
    params: PaginationParams,
    category?: ProgramCategory,
  ): Promise<PaginatedResponse<Program>> {
    const where: FindOptionsWhere<Program> = {
      status: ProgramStatus.ACTIVE,
      ...(category && { category }),
    };

    return this.paginate(
      params,
      undefined as any,
      undefined as any,
      undefined as any,
      where,
      ['projects', 'impactMetrics'], // 👈 PROJECTS INCLUDED
    );
  }

  // ---------- ADMIN ----------
  async findAdminPrograms(
    params: PaginationParams,
    status?: ProgramStatus,
  ): Promise<PaginatedResponse<Program>> {
    const where: FindOptionsWhere<Program> = {
      ...(status && { status }),
    };

    return this.paginate(params, undefined as any, undefined as any, undefined as any, where, [
      'projects',
      'impactMetrics',
      'stories',
      'donations',
    ]);
  }

  async findProgramById(id: string): Promise<Program | null> {
    return this.findOne(id, ['projects', 'impactMetrics', 'stories']);
  }

  async createProgram(data: Partial<Program>): Promise<Program> {
    return this.create(data);
  }

  async updateProgram(id: string, data: Partial<Program>) {
    return this.update(id, data);
  }

  async deactivateProgram(id: string) {
    await this.update(id, { status: ProgramStatus.INACTIVE } as any);
    return this.findOne(id);
  }
}
