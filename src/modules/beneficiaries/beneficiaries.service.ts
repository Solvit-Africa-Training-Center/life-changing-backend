import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Beneficiary } from './entities/beneficiary.entity';
import { BeneficiaryBaseService } from './services/beneficiary-base.service';

@Injectable()
export class BeneficiariesService {
    constructor(
        @InjectRepository(Beneficiary) private readonly beneficiaryRepo: Repository<Beneficiary>,
        private readonly baseService: BeneficiaryBaseService,
    ) { }

    async getProgramInfo(userId: string) {
        const beneficiary = await this.beneficiaryRepo.findOne({
            where: { user: { id: userId } },
            relations: ['program'],
        });

        if (!beneficiary) throw new NotFoundException('Beneficiary not found');
        if (!beneficiary.program) throw new NotFoundException('Beneficiary is not enrolled in any program');

        return beneficiary.program;
    }

    async getProfile(userId: string) {
        const beneficiary = await this.beneficiaryRepo.findOne({
            where: { user: { id: userId } },
            relations: ['program', 'emergencyContacts', 'user'],
        });

        if (!beneficiary) throw new NotFoundException('Beneficiary not found');

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
}
