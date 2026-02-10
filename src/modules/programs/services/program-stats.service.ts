// src/modules/programs/services/program-stats.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Program } from '../entities/program.entity';

@Injectable()
export class ProgramStatsService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
  ) {}

  async getProgramWithStats(id: string): Promise<any> {
    const program = await this.programRepository.findOne({
      where: { id },
      relations: ['beneficiaries', 'donations', 'projects'],
    });

    if (!program) {
      throw new Error(`Program with ID ${id} not found`);
    }

    const beneficiaryCount = program.beneficiaries?.length || 0;
    const totalDonations = this.calculateTotalDonations(program);
    const projects = this.calculateProjectStats(program);

    return {
      ...program,
      statistics: {
        beneficiaryCount,
        totalDonations,
        fundsUtilizationPercentage: this.calculateFundsUtilizationPercentage(program),
        projects,
      },
    };
  }

  private calculateTotalDonations(program: Program): number {
    if (!program.donations) return 0;
    
    return program.donations.reduce((sum, donation) => 
      sum + (parseFloat(donation.amount as any) || 0), 0);
  }

  private calculateFundsUtilizationPercentage(program: Program): number {
    const budget = parseFloat(program.budget as any);
    const fundsUtilized = parseFloat(program.fundsUtilized as any);
    
    return budget > 0 ? Math.round((fundsUtilized / budget) * 100) : 0;
  }

  private calculateProjectStats(program: Program): any[] {
    if (!program.projects) return [];

    return program.projects.map(project => ({
      id: project.id,
      name: project.name,
      budgetRequired: parseFloat(project.budgetRequired as any),
      budgetReceived: parseFloat(project.budgetReceived as any),
      completionPercentage: this.calculateProjectCompletionPercentage(project),
    }));
  }

  private calculateProjectCompletionPercentage(project: any): number {
    const budgetRequired = parseFloat(project.budgetRequired as any);
    const budgetReceived = parseFloat(project.budgetReceived as any);
    
    return budgetRequired > 0 ? Math.round((budgetReceived / budgetRequired) * 100) : 0;
  }
}