// src/modules/programs/services/program-creation.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Program } from '../entities/program.entity';
import { CreateProgramDTO } from '../dto/create-program.dto';
import { ProgramStatus } from '../../../config/constants';
import { ProgramMediaService } from './program-media.service';
import { ProgramProjectService } from './program-project.service';

@Injectable()
export class ProgramCreationService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    private readonly mediaService: ProgramMediaService,
    private readonly projectService: ProgramProjectService,
  ) {}

  async createProgram(
    dto: CreateProgramDTO,
    coverImage?: Express.Multer.File,
    logo?: Express.Multer.File,
  ): Promise<Program> {
    // 1. Create program entity
    const program = await this.createProgramEntity(dto);
    
    // 2. Upload media files
    await this.handleMediaUpload(program, coverImage, logo);
    
    // 3. Create projects if any
    if (dto.projects?.length) {
      await this.projectService.createProjectsForProgram(program, dto.projects);
    }

    // Return the created program
    return program;
  }

  private async createProgramEntity(dto: CreateProgramDTO): Promise<Program> {
    const program = new Program();
    program.name = dto.name;
    program.description = dto.description;
    program.category = dto.category;
    program.sdgAlignment = dto.sdgAlignment;
    program.kpiTargets = dto.kpiTargets;
    program.startDate = new Date(dto.startDate);
    program.budget = dto.budget;
    program.status = dto.status || ProgramStatus.ACTIVE;
    program.fundsAllocated = 0;
    program.fundsUtilized = 0;
    program.sortOrder = 0;

    if (dto.endDate && dto.endDate.trim() !== '') {
      program.endDate = new Date(dto.endDate);
    }

    return await this.programRepository.save(program);
  }

  private async handleMediaUpload(
    program: Program,
    coverImage?: Express.Multer.File,
    logo?: Express.Multer.File,
  ): Promise<void> {
    const mediaUpdates: Promise<void>[] = [];

    if (coverImage) {
      mediaUpdates.push(this.updateCoverImage(program, coverImage));
    }

    if (logo) {
      mediaUpdates.push(this.updateLogo(program, logo));
    }

    if (mediaUpdates.length > 0) {
      await Promise.all(mediaUpdates);
    }
  }

  private async updateCoverImage(program: Program, coverImage: Express.Multer.File): Promise<void> {
    const upload = await this.mediaService.uploadCoverImage(program.id, coverImage);
    program.coverImage = upload.url;
    program.coverImagePublicId = upload.publicId;
    await this.programRepository.save(program);
  }

  private async updateLogo(program: Program, logo: Express.Multer.File): Promise<void> {
    const upload = await this.mediaService.uploadLogo(program.id, logo);
    program.logo = upload.url;
    program.logoPublicId = upload.publicId;
    await this.programRepository.save(program);
  }
}