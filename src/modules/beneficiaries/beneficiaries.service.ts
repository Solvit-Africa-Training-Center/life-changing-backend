import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Beneficiary } from './entities/beneficiary.entity';
import { WeeklyTracking } from './entities/weekly-tracking.entity';
import { Goal } from './entities/goal.entity';
import { Program } from '../programs/entities/program.entity';
import { GoalStatus } from '../../config/constants';

@Injectable()
export class BeneficiariesService {
    constructor(
        @InjectRepository(Beneficiary)
        private readonly beneficiaryRepo: Repository<Beneficiary>,
        @InjectRepository(WeeklyTracking)
        private readonly trackingRepo: Repository<WeeklyTracking>,
        @InjectRepository(Goal)
        private readonly goalRepo: Repository<Goal>,
    ) { }

    async findByUserId(userId: string): Promise<Beneficiary> {
        const beneficiary = await this.beneficiaryRepo.findOne({
            where: { user: { id: userId } },
            relations: ['program', 'user']
        });

        if (!beneficiary) {
            throw new NotFoundException(`Beneficiary with user ID ${userId} not found`);
        }

        return beneficiary;
    }

    async getProgramInfo(userId: string): Promise<Program> {
        const beneficiary = await this.beneficiaryRepo.findOne({
            where: { user: { id: userId } },
            relations: ['program'],
        });

        if (!beneficiary) {
            throw new NotFoundException('Beneficiary not found');
        }

        if (!beneficiary.program) {
            throw new NotFoundException('Beneficiary is not enrolled in any program');
        }

        return beneficiary.program;
    }

    async getUpdates(userId: string): Promise<{ recentTrackings: WeeklyTracking[], goals: Goal[] }> {
        const beneficiary = await this.findByUserId(userId);

        const recentTrackings = await this.trackingRepo.find({
            where: { beneficiary: { id: beneficiary.id } },
            order: { weekEnding: 'DESC' },
            take: 5,
        });

        const goals = await this.goalRepo.find({
            where: { beneficiary: { id: beneficiary.id }, status: GoalStatus.IN_PROGRESS },
            order: { targetDate: 'ASC' },
        });

        return {
            recentTrackings,
            goals,
        };
    }

    // Method specifically optimized for USSD (offline access)
    async getUSSDSummary(userId: string): Promise<{
        programName: string;
        currentCapital: number;
        nextTracking: Date;
        activeGoal: string
    } | null> {
        const beneficiary = await this.beneficiaryRepo.findOne({
            where: { user: { id: userId } },
            relations: ['program', 'goals'],
        });

        if (!beneficiary) {
            return null;
        }

        const activeGoal = beneficiary.goals?.find(g => g.status === GoalStatus.IN_PROGRESS);

        // Handle multilingual program name
        const programName = beneficiary.program
            ? (beneficiary.program.name as unknown as { en: string }).en
            : 'Not Enrolled';

        return {
            programName,
            currentCapital: beneficiary.currentCapital,
            nextTracking: beneficiary.nextTrackingDate,
            activeGoal: activeGoal ? `${activeGoal.description} (${activeGoal.currentProgress}/${activeGoal.targetAmount})` : 'No active goal'
        };
    }
}
