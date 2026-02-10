// src/modules/beneficiaries/services/beneficiary-stats.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Beneficiary } from '../entities/beneficiary.entity';
import { BeneficiaryStatsDto } from '../dto/beneficiary-stats.dto';

@Injectable()
export class BeneficiaryStatsService {
  constructor(
    @InjectRepository(Beneficiary)
    private beneficiariesRepository: Repository<Beneficiary>,
  ) {}

  async getBeneficiaryStats(): Promise<BeneficiaryStatsDto> {
    const [totalBeneficiaries, byStatus, byProgram, totalCapitalResult] = await Promise.all([
      this.getTotalBeneficiaries(),
      this.getStatsByStatus(),
      this.getStatsByProgram(),
      this.getTotalCapital(),
    ]);

    return {
      totalBeneficiaries,
      byStatus,
      byProgram,
      totalCapital: parseFloat(totalCapitalResult?.total || '0') || 0,
    };
  }

  private async getTotalBeneficiaries(): Promise<number> {
    return await this.beneficiariesRepository.count();
  }

  private async getStatsByStatus(): Promise<any[]> {
    return await this.beneficiariesRepository
      .createQueryBuilder('beneficiary')
      .select('beneficiary.status, COUNT(*) as count')
      .groupBy('beneficiary.status')
      .getRawMany();
  }

  private async getStatsByProgram(): Promise<any[]> {
    return await this.beneficiariesRepository
      .createQueryBuilder('beneficiary')
      .select('program.name, COUNT(*) as count')
      .leftJoin('beneficiary.program', 'program')
      .groupBy('program.name')
      .getRawMany();
  }

  private async getTotalCapital(): Promise<any> {
    return await this.beneficiariesRepository
      .createQueryBuilder('beneficiary')
      .select('SUM(beneficiary.current_capital)', 'total')
      .getRawOne();
  }
}