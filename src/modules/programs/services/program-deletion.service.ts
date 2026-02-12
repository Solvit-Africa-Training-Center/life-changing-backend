// src/modules/programs/services/program-deletion.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Program } from '../entities/program.entity';
import { ProgramMediaService } from './program-media.service';
import { ProgramQueryService } from './program-query.service';

@Injectable()
export class ProgramDeletionService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    private readonly queryService: ProgramQueryService,
    private readonly mediaService: ProgramMediaService,
  ) {}

  async deleteProgram(id: string): Promise<void> {
    const program = await this.queryService.findProgramWithBasicInfo(id);

      if (program.projects && program.projects.length > 0) {
      throw new BadRequestException(
        'Cannot delete program with existing projects. Delete or reassign projects first.'
      );
    }

    if (program.beneficiaries && program.beneficiaries.length > 0) {
      throw new BadRequestException(
        'Cannot delete program with existing beneficiaries.'
      );
    }

    // Delete images from Cloudinary
    await this.mediaService.deleteImages(program.coverImagePublicId, program.logoPublicId);

    // Delete program from database
    await this.programRepository.delete(id);
  }
}