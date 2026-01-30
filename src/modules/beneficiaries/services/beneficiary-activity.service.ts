import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeeklyTracking } from '../entities/weekly-tracking.entity';
import { Goal } from '../entities/goal.entity';
import { GoalStatus } from '../../../config/constants';
import { BeneficiaryBaseService } from './beneficiary-base.service';
import { Beneficiary } from '../entities/beneficiary.entity';

@Injectable()
export class BeneficiaryActivityService {
    constructor(
        @InjectRepository(WeeklyTracking) private readonly trackingRepo: Repository<WeeklyTracking>,
        @InjectRepository(Goal) private readonly goalRepo: Repository<Goal>,
        @InjectRepository(Beneficiary) private readonly beneficiaryRepo: Repository<Beneficiary>,
        private readonly baseService: BeneficiaryBaseService,
    ) { }

    async getUpdates(userId: string) {
        const beneficiary = await this.baseService.findByUserId(userId);
        return {
            recentTrackings: await this.trackingRepo.find({
                where: { beneficiary: { id: beneficiary.id } },
                order: { weekEnding: 'DESC' },
                take: 5,
            }),
            goals: await this.goalRepo.find({
                where: { beneficiary: { id: beneficiary.id }, status: GoalStatus.IN_PROGRESS },
                order: { targetDate: 'ASC' },
            }),
        };
    }

    async submitTracking(userId: string, data: any) {
        const beneficiary = await this.baseService.findByUserId(userId);
        const tracking = this.trackingRepo.create({ ...data, beneficiary, weekEnding: new Date(), submittedAt: new Date() });
        beneficiary.currentCapital = data.currentCapital;
        await this.beneficiaryRepo.save(beneficiary);
        return this.trackingRepo.save(tracking);
    }

    async createGoal(userId: string, data: any) {
        const beneficiary = await this.baseService.findByUserId(userId);
        return this.goalRepo.save(this.goalRepo.create({ ...data, beneficiary, currentProgress: 0, status: GoalStatus.NOT_STARTED }));
    }

    async updateGoal(userId: string, goalId: string, data: any) {
        const beneficiary = await this.baseService.findByUserId(userId);
        const goal = await this.goalRepo.findOne({ where: { id: goalId, beneficiary: { id: beneficiary.id } } });
        if (!goal) throw new NotFoundException('Goal not found');
        Object.assign(goal, data);
        if (goal.currentProgress >= goal.targetAmount && goal.status !== GoalStatus.ACHIEVED) {
            goal.status = GoalStatus.ACHIEVED;
            goal.completedAt = new Date();
        }
        return this.goalRepo.save(goal);
    }

    async requestSupport(userId: string, description: string) {
        const beneficiary = await this.baseService.findByUserId(userId);
        beneficiary.requiresSpecialAttention = true;
        await this.beneficiaryRepo.save(beneficiary);
        const latest = await this.trackingRepo.findOne({ where: { beneficiary: { id: beneficiary.id } }, order: { weekEnding: 'DESC' } });
        if (latest) {
            latest.challenges = latest.challenges ? `${latest.challenges} | [URGENT]: ${description}` : `[URGENT]: ${description}`;
            await this.trackingRepo.save(latest);
        }
        return { message: 'Support request received. A team member will contact you within 24 hours.' };
    }
}
