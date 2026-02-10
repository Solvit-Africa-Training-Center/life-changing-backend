// src/modules/programs/services/program-deletion.service.ts
import { Injectable } from '@nestjs/common';
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

    // Delete images from Cloudinary
    await this.mediaService.deleteImages(program.coverImagePublicId, program.logoPublicId);

    // Delete program from database
    await this.programRepository.delete(id);
  }
}