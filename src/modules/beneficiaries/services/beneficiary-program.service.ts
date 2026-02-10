// src/modules/beneficiaries/services/beneficiary-program.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Beneficiary } from '../entities/beneficiary.entity';
import { Program } from '../../programs/entities/program.entity';
import { AssignProgramDto } from '../dto/assign-program.dto';
import { BeneficiaryStatus, ProgramStatus } from '../../../config/constants';

@Injectable()
export class BeneficiaryProgramService {
  constructor(
    @InjectRepository(Beneficiary)
    private beneficiariesRepository: Repository<Beneficiary>,
    @InjectRepository(Program)
    private programsRepository: Repository<Program>,
  ) {}

  async assignProgram(beneficiaryId: string, assignProgramDto: AssignProgramDto): Promise<Beneficiary> {
    const beneficiary = await this.beneficiariesRepository.findOne({
      where: { id: beneficiaryId },
      relations: ['program', 'user']
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    if (beneficiary.program) {
      throw new ConflictException('Beneficiary is already assigned to a program');
    }

    const program = await this.validateAndGetProgram(assignProgramDto.programId);
    const enrollmentDate = this.getEnrollmentDate(assignProgramDto.enrollmentDate);

    beneficiary.program = program;
    beneficiary.enrollmentDate = enrollmentDate;
    beneficiary.status = program.status === ProgramStatus.PLANNING
      ? BeneficiaryStatus.WAITING
      : BeneficiaryStatus.ACTIVE;
    beneficiary.profileCompletion = 100;

    const updatedBeneficiary = await this.beneficiariesRepository.save(beneficiary);

    if (beneficiary.startCapital > 0) {
      await this.updateProgramFundsAllocated(program.id, beneficiary.startCapital);
    }

    return plainToInstance(Beneficiary, updatedBeneficiary);
  }

  private async validateAndGetProgram(programId: string): Promise<Program> {
    const program = await this.programsRepository.findOne({
      where: {
        id: programId,
        status: In([ProgramStatus.ACTIVE, ProgramStatus.PLANNING])
      },
    });

    if (!program) {
      throw new NotFoundException('Program not found or not available for enrollment');
    }

    return program;
  }

  private getEnrollmentDate(enrollmentDateString?: string): Date {
    return enrollmentDateString ? new Date(enrollmentDateString) : new Date();
  }

  private async updateProgramFundsAllocated(programId: string, amount: number): Promise<void> {
    await this.programsRepository.createQueryBuilder()
      .update(Program)
      .set({
        fundsAllocated: () => `funds_allocated + ${amount}`,
      })
      .where('id = :id', { id: programId })
      .execute();
  }
}