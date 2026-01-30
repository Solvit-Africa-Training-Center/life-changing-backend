import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Beneficiary } from '../entities/beneficiary.entity';
import { GoalStatus } from '../../../config/constants';

@Injectable()
export class BeneficiaryUssdService {
    constructor(
        @InjectRepository(Beneficiary) private readonly beneficiaryRepo: Repository<Beneficiary>,
    ) { }

    async getSummary(userId: string, lang: 'en' | 'rw' = 'en') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) return null;

        const beneficiary = await this.beneficiaryRepo.findOne({
            where: { user: { id: userId } },
            relations: ['program', 'goals'],
        });

        if (!beneficiary) return null;

        const activeGoal = beneficiary.goals?.find(g => g.status === GoalStatus.IN_PROGRESS);
        const programName = beneficiary.program?.name?.[lang] || beneficiary.program?.name?.['en'] || 'Not Enrolled';

        return {
            programName,
            currentCapital: beneficiary.currentCapital,
            nextTracking: beneficiary.nextTrackingDate,
            activeGoal: activeGoal ? `${activeGoal.description} (${activeGoal.currentProgress}/${activeGoal.targetAmount})` : (lang === 'rw' ? 'Nta ntego ihari' : 'No active goal')
        };
    }
}
