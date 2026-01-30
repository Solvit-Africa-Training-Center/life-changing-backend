import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Beneficiary } from '../entities/beneficiary.entity';

@Injectable()
export class BeneficiaryBaseService {
    constructor(
        @InjectRepository(Beneficiary)
        private readonly beneficiaryRepo: Repository<Beneficiary>,
    ) { }

    async findByUserId(userId: string): Promise<Beneficiary> {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
            throw new BadRequestException('Invalid user ID format: expected a valid UUID');
        }

        const beneficiary = await this.beneficiaryRepo.findOne({
            where: { user: { id: userId } },
            relations: ['program', 'user']
        });

        if (!beneficiary) {
            throw new NotFoundException(`Beneficiary with user ID ${userId} not found`);
        }

        return beneficiary;
    }
}
