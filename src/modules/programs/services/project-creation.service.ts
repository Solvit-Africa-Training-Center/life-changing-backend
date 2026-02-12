// src/modules/programs/services/project-creation.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from '../entities/project.entity';
import { Program } from '../entities/program.entity';
import { CreateProjectDTO } from '../dto/create-project.dto';
import { ProjectValidationService } from './project-validation.service';
import { CloudinaryService } from '../../../shared/services/cloudinary.service';

@Injectable()
export class ProjectCreationService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    private readonly validationService: ProjectValidationService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createProject(
    programId: string,
    dto: CreateProjectDTO,
    coverImage?: Express.Multer.File,
  ): Promise<Project> {
    // Validate program exists
    const program = await this.validationService.validateProgramExists(programId);

    // Create new project
    const project = this.projectRepository.create({
      ...dto,
      program,
      // Initialize default values
      budgetReceived: 0,
      budgetUtilized: 0,
      isActive: true,
      isFeatured: false,
      donationAllocationPercentage: 100,
      // Convert dates in timeline
      timeline: dto.timeline ? {
        ...dto.timeline,
        start: new Date(dto.timeline.start),
        end: new Date(dto.timeline.end),
      } : undefined,
      // Initialize impact metrics with default values
      impactMetrics: dto.impactMetrics || {
        beneficiariesTarget: 0,
        beneficiariesReached: 0,
        successIndicators: [],
      },
    });

    // Handle cover image upload
    if (coverImage) {
      await this.uploadCoverImage(project, programId, coverImage);
    }

    return this.projectRepository.save(project);
  }

  private async uploadCoverImage(
    project: Project,
    programId: string,
    file: Express.Multer.File
  ): Promise<void> {
    const upload = await this.cloudinaryService.uploadProjectCover(programId, project.id, file);
    project.coverImage = upload.url;
    project.coverImagePublicId = upload.publicId;
  }
}