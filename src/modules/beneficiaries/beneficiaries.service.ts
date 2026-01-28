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

    async getProfile(userId: string) {
        const beneficiary = await this.beneficiaryRepo.findOne({
            where: { user: { id: userId } },
            relations: ['program', 'emergencyContacts', 'user'],
        });

        if (!beneficiary) {
            throw new NotFoundException('Beneficiary not found');
        }

        return {
            fullName: beneficiary.fullName,
            status: beneficiary.status,
            program: beneficiary.program ? {
                name: beneficiary.program.name,
                startDate: beneficiary.program.startDate,
                endDate: beneficiary.program.endDate,
            } : null,
            currentCapital: beneficiary.currentCapital,
            joinDate: beneficiary.enrollmentDate,
            emergencyContacts: beneficiary.emergencyContacts,
            requiresSpecialAttention: beneficiary.requiresSpecialAttention,
        };
    }

    async submitWeeklyTracking(userId: string, data: any) {
        const beneficiary = await this.findByUserId(userId);

        // Create new tracking
        const tracking = this.trackingRepo.create({
            ...data,
            beneficiary,
            weekEnding: new Date(), // Defaults to current date as submission date
            submittedAt: new Date(),
        });

        // Update beneficiary capital
        beneficiary.currentCapital = data.currentCapital;
        await this.beneficiaryRepo.save(beneficiary);

        return this.trackingRepo.save(tracking);
    }

    async createGoal(userId: string, data: any) {
        const beneficiary = await this.findByUserId(userId);

        const goal = this.goalRepo.create({
            ...data,
            beneficiary,
            currentProgress: 0,
            status: GoalStatus.NOT_STARTED,
        });

        return this.goalRepo.save(goal);
    }

    async updateGoal(userId: string, goalId: string, data: any) {
        const beneficiary = await this.findByUserId(userId);

        const goal = await this.goalRepo.findOne({
            where: { id: goalId, beneficiary: { id: beneficiary.id } }
        });

        if (!goal) {
            throw new NotFoundException('Goal not found');
        }

        Object.assign(goal, data);

        // Auto-complete if progress meets target
        if (goal.currentProgress >= goal.targetAmount && goal.status !== GoalStatus.ACHIEVED) {
            goal.status = GoalStatus.ACHIEVED;
            goal.completedAt = new Date();
        }

        return this.goalRepo.save(goal);
    }

    async requestSupport(userId: string, description: string) {
        const beneficiary = await this.findByUserId(userId);

        // Flag for attention
        beneficiary.requiresSpecialAttention = true;
        await this.beneficiaryRepo.save(beneficiary);

        // Create a special "support" tracking entry or similar would be ideal, 
        // but for now we update the flag as the core requirement.
        // We can also check if there's an active tracking and append the note.
        const latestTracking = await this.trackingRepo.findOne({
            where: { beneficiary: { id: beneficiary.id } },
            order: { weekEnding: 'DESC' }
        });

        if (latestTracking) {
            latestTracking.challenges = latestTracking.challenges
                ? `${latestTracking.challenges} | [URGENT]: ${description}`
                : `[URGENT]: ${description}`;
            await this.trackingRepo.save(latestTracking);
        }

        return { message: 'Support request received. A team member will contact you within 24 hours.' };
    }

    // Method specifically optimized for USSD (offline access)
    async getUSSDSummary(userId: string, lang: 'en' | 'rw' = 'en'): Promise<{
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
        const programName = beneficiary.program && beneficiary.program.name
            ? (beneficiary.program.name as any)[lang] || (beneficiary.program.name as any)['en']
            : 'Not Enrolled';

        return {
            programName,
            currentCapital: beneficiary.currentCapital,
            nextTracking: beneficiary.nextTrackingDate,
            activeGoal: activeGoal ? `${activeGoal.description} (${activeGoal.currentProgress}/${activeGoal.targetAmount})` : (lang === 'rw' ? 'Nta ntego ihari' : 'No active goal')
        };
    }
}
