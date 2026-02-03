import { Module } from '@nestjs/common';
import { BeneficiariesController } from './beneficiaries.controller';
import { BeneficiariesService } from './services/beneficiaries.service';

@Module({
  controllers: [BeneficiariesController],
  providers: [BeneficiariesService]
})
export class BeneficiariesModule {}
