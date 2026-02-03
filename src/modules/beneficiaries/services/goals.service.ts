// src/modules/beneficiaries/services/goals.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between } from 'typeorm';
import { Goal } from '../entities/goal.entity';
import { Beneficiary } from '../entities/beneficiary.entity';
import { BaseService } from '../../../shared/services/base.service';
import { PaginationParams, PaginatedResponse } from '../../../shared/interfaces/pagination.interface';
import { CreateGoalDto, UpdateGoalDto } from '../dto/create-goal.dto';
import { GoalType, GoalStatus } from '../../../config/constants';

@Injectable()
export class GoalsService extends BaseService<Goal> {
  constructor(
    @InjectRepository(Goal)
    private goalsRepository: Repository<Goal>,
    @InjectRepository(Beneficiary)
    private beneficiariesRepository: Repository<Beneficiary>,
  ) {
    super(goalsRepository);
  }

  async createGoal(
    beneficiaryId: string,
    createGoalDto: CreateGoalDto
  ): Promise<Goal> {
    const beneficiary = await this.beneficiariesRepository.findOne({
      where: { id: beneficiaryId },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    const goal = this.goalsRepository.create({
      beneficiary,
      description: createGoalDto.description,
      type: createGoalDto.type,
      targetAmount: createGoalDto.targetAmount,
      targetDate: new Date(createGoalDto.targetDate),
      milestones: createGoalDto.milestones,
      notes: createGoalDto.notes,
      actionPlan: createGoalDto.actionPlan,
      status: GoalStatus.NOT_STARTED,
      currentProgress: 0,
    });

    return await this.goalsRepository.save(goal);
  }

  async getBeneficiaryGoals(
    beneficiaryId: string,
    paginationParams: PaginationParams
  ): Promise<PaginatedResponse<Goal>> {
    const where: FindOptionsWhere<Goal> = { beneficiary: { id: beneficiaryId } };
    return this.paginate(paginationParams, where, ['beneficiary']);
  }

  async getGoalsByType(
    beneficiaryId: string,
    goalType: GoalType,
    paginationParams: PaginationParams
  ): Promise<PaginatedResponse<Goal>> {
    const where: FindOptionsWhere<Goal> = {
      beneficiary: { id: beneficiaryId },
      type: goalType,
    };
    return this.paginate(paginationParams, where, ['beneficiary']);
  }

  async getGoalsByStatus(
    beneficiaryId: string,
    status: GoalStatus,
    paginationParams: PaginationParams
  ): Promise<PaginatedResponse<Goal>> {
    const where: FindOptionsWhere<Goal> = {
      beneficiary: { id: beneficiaryId },
      status,
    };
    return this.paginate(paginationParams, where, ['beneficiary']);
  }

  async updateGoalProgress(
    goalId: string,
    progress: number
  ): Promise<Goal> {
    const goal = await this.findOne(goalId);
    
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    goal.currentProgress = progress;
    
    // Update status based on progress
    if (progress >= goal.targetAmount) {
      goal.status = GoalStatus.ACHIEVED;
      goal.completedAt = new Date();
    } else if (progress > 0) {
      goal.status = GoalStatus.IN_PROGRESS;
    }

    // Update milestone completion
    if (goal.milestones) {
      goal.milestones = goal.milestones.map(milestone => {
        if (!milestone.completed && progress >= milestone.targetAmount) {
          return {
            ...milestone,
            completed: true,
            completedAt: new Date(),
          };
        }
        return milestone;
      });
    }

    return await this.goalsRepository.save(goal);
  }

  async getGoalStats(beneficiaryId: string) {
    const stats = await this.goalsRepository
      .createQueryBuilder('goal')
      .select('goal.type, COUNT(*) as count, goal.status')
      .where('goal.beneficiary_id = :beneficiaryId', { beneficiaryId })
      .groupBy('goal.type, goal.status')
      .getRawMany();

    const progressStats = await this.goalsRepository
      .createQueryBuilder('goal')
      .select('AVG(goal.currentProgress / goal.targetAmount * 100) as average_completion_percentage')
      .where('goal.beneficiary_id = :beneficiaryId AND goal.status != :status', {
        beneficiaryId,
        status: GoalStatus.ACHIEVED,
      })
      .getRawOne();

    return {
      byType: stats,
      averageCompletionPercentage: parseFloat(progressStats?.average_completion_percentage || '0'),
    };
  }
}