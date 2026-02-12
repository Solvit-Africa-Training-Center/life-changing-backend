// src/modules/programs/services/project-update.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from '../entities/project.entity';
import { UpdateProjectDTO } from '../dto/update-project.dto';
import { ProjectValidationService } from './project-validation.service';

@Injectable()
export class ProjectUpdateService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly validationService: ProjectValidationService,
  ) {}

  async updateProject(
    programId: string,
    projectId: string,
    dto: UpdateProjectDTO,
  ): Promise<Project> {
    const { project } = await this.validationService.validateProgramAndProject(programId, projectId);

    // Update basic fields
    this.updateBasicFields(project, dto);
    
    // Update timeline with date conversion
    if (dto.timeline) {
      project.timeline = {
        ...dto.timeline,
        start: new Date(dto.timeline.start),
        end: new Date(dto.timeline.end),
        milestones: dto.timeline.milestones || [],
      };
    }

    return this.projectRepository.save(project);
  }

  private updateBasicFields(project: Project, dto: UpdateProjectDTO): void {
    if (dto.name !== undefined) project.name = dto.name;
    if (dto.description !== undefined) project.description = dto.description;
    if (dto.budgetRequired !== undefined) project.budgetRequired = dto.budgetRequired;
    if (dto.location !== undefined) project.location = dto.location;
    if (dto.impactMetrics !== undefined) {
      project.impactMetrics = {
        ...project.impactMetrics,
        ...dto.impactMetrics,
      };
    }
  }
}