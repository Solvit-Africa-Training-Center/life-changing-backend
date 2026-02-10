// src/modules/programs/services/project-budget.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from '../entities/project.entity';
import { ProjectValidationService } from './project-validation.service';

@Injectable()
export class ProjectBudgetService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly validationService: ProjectValidationService,
  ) {}

  async updateDonationAllocation(
    projectId: string,
    percentage: number,
  ): Promise<Project> {
    this.validatePercentage(percentage);

    const project = await this.validationService.validateProjectExists(projectId);

    project.donationAllocationPercentage = percentage;
    return this.projectRepository.save(project);
  }

  async updateProjectBudget(
    projectId: string,
    updates: {
      budgetRequired?: number;
      budgetReceived?: number;
      budgetUtilized?: number;
    },
  ): Promise<Project> {
    const project = await this.validationService.validateProjectExists(projectId);

    this.applyBudgetUpdates(project, updates);
    return this.projectRepository.save(project);
  }

  private validatePercentage(percentage: number): void {
    if (percentage < 0 || percentage > 100) {
      throw new BadRequestException('Percentage must be between 0 and 100');
    }
  }

  private applyBudgetUpdates(
    project: Project,
    updates: {
      budgetRequired?: number;
      budgetReceived?: number;
      budgetUtilized?: number;
    }
  ): void {
    if (updates.budgetRequired !== undefined) {
      project.budgetRequired = updates.budgetRequired;
    }
    if (updates.budgetReceived !== undefined) {
      project.budgetReceived = updates.budgetReceived;
    }
    if (updates.budgetUtilized !== undefined) {
      project.budgetUtilized = updates.budgetUtilized;
    }
  }

  calculateCompletionPercentage(project: Project): number {
    const budgetRequired = parseFloat(project.budgetRequired as any);
    const budgetReceived = parseFloat(project.budgetReceived as any);
    
    return budgetRequired > 0 
      ? Math.round((budgetReceived / budgetRequired) * 100) 
      : 0;
  }

  calculateRemainingBudget(project: Project): number {
    const budgetRequired = parseFloat(project.budgetRequired as any);
    const budgetReceived = parseFloat(project.budgetReceived as any);
    
    return budgetRequired - budgetReceived;
  }
}