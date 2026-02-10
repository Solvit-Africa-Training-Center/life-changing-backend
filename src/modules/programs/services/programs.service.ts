import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../../shared/services/base.service';
import { Program } from '../entities/program.entity';
import { CreateProgramDTO } from '../dto/create-program.dto';
import { UpdateProgramDTO } from '../dto/update-program.dto';
import { ProgramCategory, ProgramStatus } from '../../../config/constants';
import { PaginationParams } from '../../../shared/interfaces/pagination.interface';

import { ProgramQueryService } from './program-query.service';
import { ProgramCreationService } from './program-creation.service';
import { ProgramUpdateService } from './program-update.service';
import { ProgramStatsService } from './program-stats.service';
import { ProgramDeletionService } from './program-deletion.service';



@Injectable()
export class ProgramsService extends BaseService<Program> {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    private readonly queryService: ProgramQueryService,
    private readonly creationService: ProgramCreationService,
    private readonly updateService: ProgramUpdateService,
    private readonly statsService: ProgramStatsService,
    private readonly deletionService: ProgramDeletionService,
  ) {
    super(programRepository);
  }

  // Query methods (delegated)
  async findPublicPrograms(params: PaginationParams, category?: ProgramCategory) {
    return this.queryService.findPublicPrograms(params, category);
  }

  async findAdminPrograms(params: PaginationParams, status?: ProgramStatus) {
    return this.queryService.findAdminPrograms(params, status);
  }

  async findProgramById(id: string): Promise<Program> {
    return this.queryService.findProgramById(id);
  }

  // Creation method (delegated)
  async createProgram(
    dto: CreateProgramDTO,
    coverImage?: Express.Multer.File,
    logo?: Express.Multer.File,
  ): Promise<Program> {
    return this.creationService.createProgram(dto, coverImage, logo);
  }

  // Update method (delegated)
  async updateProgram(
    id: string,
    dto: UpdateProgramDTO,
    coverImage?: Express.Multer.File,
    logo?: Express.Multer.File,
  ): Promise<Program> {
    return this.updateService.updateProgram(id, dto, coverImage, logo);
  }

  // Deletion method (delegated)
  async deleteProgram(id: string): Promise<void> {
    return this.deletionService.deleteProgram(id);
  }

  // Statistics method (delegated)
  async getProgramWithStats(id: string): Promise<any> {
    return this.statsService.getProgramWithStats(id);
  }

  async findOne(id: string, relations: string[] = []): Promise<Program | null> {
    try {
      return await this.queryService.findProgramById(id);
    } catch (error) {
      return null;
    }
  }

}