// src/modules/programs/services/projects.service.ts
import { Injectable } from '@nestjs/common';
import { Project } from '../entities/project.entity';
import { Program } from '../entities/program.entity';

import { ProjectValidationService } from './project-validation.service';
import { ProjectMediaService } from './project-media.service';
import { ProjectBudgetService } from './project-budget.service';
import { ProjectQueryService } from './project-query.service';
import { ProjectCreationService } from './project-creation.service';
import { ProjectUpdateService } from './project-update.service';
import { ProjectDeletionService } from './project-deletion.service';
import { CreateProjectDTO } from '../dto/create-project.dto';
import { UpdateProjectDTO } from '../dto/update-project.dto';


@Injectable()
export class ProjectsService {
  constructor(

    private readonly validationService: ProjectValidationService,
    private readonly mediaService: ProjectMediaService,
    private readonly budgetService: ProjectBudgetService,
    private readonly queryService: ProjectQueryService,
    private readonly creationService: ProjectCreationService,
    private readonly updateService: ProjectUpdateService,
    private readonly deletionService: ProjectDeletionService,

  ) { }

   // ================= CREATE PROJECT =================
  async createProject(
    programId: string,
    dto: CreateProjectDTO,
    coverImage?: Express.Multer.File,
  ): Promise<Project> {
    return this.creationService.createProject(programId, dto, coverImage);
  }

  // ================= UPDATE PROJECT =================
  async updateProject(
    programId: string,
    projectId: string,
    dto: UpdateProjectDTO,
  ): Promise<Project> {
    return this.updateService.updateProject(programId, projectId, dto);
  }

  // ================= DELETE PROJECT =================
  async deleteProject(
    programId: string,
    projectId: string,
  ): Promise<void> {
    return this.deletionService.deleteProject(programId, projectId);
  }

  // ================= PROJECT COVER IMAGE (delegated) =================
  async uploadProjectCover(
    programId: string,
    projectId: string,
    file: Express.Multer.File,
  ): Promise<Project> {
    return this.mediaService.uploadProjectCover(programId, projectId, file);
  }

  // ================= PROJECT GALLERY (delegated) =================
  async uploadToGallery(
    programId: string,
    projectId: string,
    file: Express.Multer.File,
    caption?: string,
  ): Promise<Project> {
    return this.mediaService.uploadToGallery(programId, projectId, file, caption);
  }

  // ================= DELETE GALLERY ITEM (delegated) =================
  async deleteGalleryItem(
    programId: string,
    projectId: string,
    publicId: string,
  ): Promise<Project> {
    return this.mediaService.deleteGalleryItem(programId, projectId, publicId);
  }

  // ================= GET PROJECT DETAILS (delegated) =================
  async getProjectDetails(projectId: string): Promise<Project> {
    return this.queryService.getProjectDetails(projectId);
  }

  // ================= UPDATE DONATION ALLOCATION (delegated) =================
  async updateDonationAllocation(
    projectId: string,
    percentage: number,
  ): Promise<Project> {
    return this.budgetService.updateDonationAllocation(projectId, percentage);
  }

  // ================= UPDATE PROJECT BUDGET (delegated) =================
  async updateProjectBudget(
    projectId: string,
    updates: {
      budgetRequired?: number;
      budgetReceived?: number;
      budgetUtilized?: number;
    },
  ): Promise<Project> {
    return this.budgetService.updateProjectBudget(projectId, updates);
  }

  // ================= GET PROJECTS BY PROGRAM (delegated) =================
  async getProjectsByProgram(
    programId: string,
    options?: {
      isActive?: boolean;
      isFeatured?: boolean;
    }
  ): Promise<Project[]> {
    return this.queryService.getProjectsByProgram(programId, options);
  }

  // ================= VALIDATION HELPERS (delegated) =================
  async validateProgramAndProject(
    programId: string,
    projectId: string
  ): Promise<{ program: Program; project: Project }> {
    return this.validationService.validateProgramAndProject(programId, projectId);
  }

  // ================= HELPER METHOD FOR BACKWARD COMPATIBILITY =================
  async findOne(projectId: string, relations: string[] = []): Promise<Project | null> {
    return this.queryService.getProjectWithRelations(projectId, relations);
  }
}