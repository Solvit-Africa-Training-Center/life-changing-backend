// src/modules/programs/services/project-query.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from '../entities/project.entity';
import { ProjectBudgetService } from './project-budget.service';
import { ProjectValidationService } from './project-validation.service';

@Injectable()
export class ProjectQueryService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly budgetService: ProjectBudgetService,
    private readonly validationService: ProjectValidationService,
  ) {}

  async getProjectDetails(projectId: string): Promise<Project & {
    completionPercentage: number;
    remainingBudget: number;
  }> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['program', 'donations'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const completionPercentage = this.budgetService.calculateCompletionPercentage(project);
    const remainingBudget = this.budgetService.calculateRemainingBudget(project);

    return {
      ...project,
      completionPercentage,
      remainingBudget,
    };
  }

  async getProjectsByProgram(
    programId: string,
    options?: {
      isActive?: boolean;
      isFeatured?: boolean;
    }
  ): Promise<Array<Project & {
    completionPercentage: number;
    remainingBudget: number;
  }>> {
    await this.validationService.validateProgramExists(programId);

    const where = this.buildWhereClause(programId, options);

    const projects = await this.projectRepository.find({
      where,
      relations: ['donations'],
      order: { createdAt: 'DESC' },
    });

    return projects.map(project => ({
      ...project,
      completionPercentage: this.budgetService.calculateCompletionPercentage(project),
      remainingBudget: this.budgetService.calculateRemainingBudget(project),
    }));
  }

  async getProjectWithRelations(
    projectId: string,
    relations: string[] = []
  ): Promise<Project | null> {
    return await this.projectRepository.findOne({
      where: { id: projectId },
      relations,
    });
  }

  private buildWhereClause(
    programId: string,
    options?: {
      isActive?: boolean;
      isFeatured?: boolean;
    }
  ): any {
    const where: any = { program: { id: programId } };
    
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }
    if (options?.isFeatured !== undefined) {
      where.isFeatured = options.isFeatured;
    }

    return where;
  }
}