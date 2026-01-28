import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BeneficiariesController } from './beneficiaries.controller';
import { BeneficiariesService } from './beneficiaries.service';
import { Beneficiary } from './entities/beneficiary.entity';
import { WeeklyTracking } from './entities/weekly-tracking.entity';
import { Goal } from './entities/goal.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Beneficiary,
      WeeklyTracking,
      Goal
    ])
  ],
  controllers: [BeneficiariesController],
  providers: [BeneficiariesService],
  exports: [BeneficiariesService]
})
export class BeneficiariesModule { }
