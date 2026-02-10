// src/modules/beneficiaries/services/beneficiary-management.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Beneficiary } from '../entities/beneficiary.entity';
import { Program } from '../../programs/entities/program.entity';
import { UpdateBeneficiaryDto } from '../dto/update-beneficiary.dto';
import { BeneficiaryStatus } from '../../../config/constants';

@Injectable()
export class BeneficiaryManagementService {
  constructor(
    @InjectRepository(Beneficiary)
    private beneficiariesRepository: Repository<Beneficiary>,
    @InjectRepository(Program)
    private programsRepository: Repository<Program>,
  ) {}

  async updateBeneficiary(beneficiaryId: string, updateBeneficiaryDto: UpdateBeneficiaryDto): Promise<Beneficiary> {
    const beneficiary = await this.beneficiariesRepository.findOne({
      where: { id: beneficiaryId },
      relations: ['user', 'program']
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    // Update program if provided
    if (updateBeneficiaryDto.programId) {
      const program = await this.programsRepository.findOne({
        where: { id: updateBeneficiaryDto.programId },
      });

      if (!program) {
        throw new NotFoundException('Program not found');
      }

      beneficiary.program = program;
      delete updateBeneficiaryDto.programId;
    }

    Object.assign(beneficiary, updateBeneficiaryDto);
    const updatedBeneficiary = await this.beneficiariesRepository.save(beneficiary);
    return plainToInstance(Beneficiary, updatedBeneficiary);
  }

  async updateBeneficiaryCapital(beneficiaryId: string, amount: number): Promise<void> {
    await this.beneficiariesRepository.update(beneficiaryId, {
      currentCapital: () => `current_capital + ${amount}`,
    });
  }

  async graduateBeneficiary(beneficiaryId: string, exitDate: Date = new Date()): Promise<Beneficiary> {
    const beneficiary = await this.beneficiariesRepository.findOne({
      where: { id: beneficiaryId }
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    beneficiary.status = BeneficiaryStatus.GRADUATED;
    beneficiary.exitDate = exitDate;

    const updatedBeneficiary = await this.beneficiariesRepository.save(beneficiary);
    return plainToInstance(Beneficiary, updatedBeneficiary);
  }
}