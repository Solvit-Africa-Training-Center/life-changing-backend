import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BeneficiariesController } from './beneficiaries.controller';
import { BeneficiaryActivityController } from './beneficiary-activity.controller';
import { BeneficiaryDocumentController } from './beneficiary-document.controller';
import { BeneficiariesService } from './beneficiaries.service';
import { BeneficiaryBaseService } from './services/beneficiary-base.service';
import { BeneficiaryActivityService } from './services/beneficiary-activity.service';
import { BeneficiaryDocumentService } from './services/beneficiary-document.service';
import { BeneficiaryUssdService } from './services/beneficiary-ussd.service';
import { Beneficiary } from './entities/beneficiary.entity';
import { WeeklyTracking } from './entities/weekly-tracking.entity';
import { Goal } from './entities/goal.entity';
import { BeneficiaryDocument } from './entities/beneficiary-document.entity';
import { CloudinaryModule } from '../../shared/cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Beneficiary, WeeklyTracking, Goal, BeneficiaryDocument]),
    CloudinaryModule
  ],
  controllers: [
    BeneficiariesController,
    BeneficiaryActivityController,
    BeneficiaryDocumentController
  ],
  providers: [
    BeneficiariesService,
    BeneficiaryBaseService,
    BeneficiaryActivityService,
    BeneficiaryDocumentService,
    BeneficiaryUssdService
  ],
  exports: [BeneficiariesService]
})
export class BeneficiariesModule { }
