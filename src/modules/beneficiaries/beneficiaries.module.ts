// src/modules/beneficiaries/beneficiaries.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { ProgramsModule } from '../programs/programs.module';
import { AdminModule } from '../admin/admin.module';
import { BeneficiariesController } from './controllers/beneficiaries.controller';
import { DocumentsController } from './controllers/documents.controller';
import { TrackingController } from './controllers/tracking.controller';
import { GoalsController } from './controllers/goals.controller';
import { EmergencyContactsController } from './controllers/emergency-contacts.controller';
import { BeneficiariesService } from './services/beneficiaries.service';
import { WeeklyTrackingService } from './services/weekly-tracking.service';
import { BeneficiaryDocumentsService } from './services/beneficiary-documents.service';
import { GoalsService } from './services/goals.service';
import { EmergencyContactsService } from './services/emergency-contacts.service';
import { Beneficiary } from './entities/beneficiary.entity';
import { WeeklyTracking } from './entities/weekly-tracking.entity';
import { Goal } from './entities/goal.entity';
import { BeneficiaryDocument } from './entities/beneficiary-document.entity';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { User } from '../users/entities/user.entity';
import { Program } from '../programs/entities/program.entity';
import { Staff } from '../admin/entities/staff.entity';
import { BeneficiaryRegistrationService } from './services/beneficiary-registration.service';
import { BeneficiaryProgramService } from './services/beneficiary-program.service';
import { BeneficiaryQueryService } from './services/beneficiary-query.service';
import { BeneficiarySearchService } from './services/beneficiary-search.service';
import { BeneficiaryStatsService } from './services/beneficiary-stats.service';
import { BeneficiaryManagementService } from './services/beneficiary-management.service';

import { DocumentValidationService } from './services/document-validation.service';
import { DocumentUploadService } from './services/document-upload.service';
import { DocumentVerificationService } from './services/document-verification.service';
import { DocumentDeletionService } from './services/document-deletion.service';
import { DocumentQueryService } from './services/document-query.service';
import { DocumentMimeTypeService } from './services/document-mimetype.service';
// import { UssdController } from '../ussd/ussd.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Beneficiary,
      WeeklyTracking,
      Goal,
      BeneficiaryDocument,
      EmergencyContact,
      User,
      Program,
      Staff,
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => ProgramsModule),
    forwardRef(() => AdminModule),
  ],
  controllers: [
    BeneficiariesController,
    DocumentsController,
    TrackingController,
    GoalsController,
    EmergencyContactsController,
    // UssdController,
  ],
  providers: [
    BeneficiariesService,

    BeneficiaryRegistrationService,
    BeneficiaryProgramService,
    BeneficiaryQueryService,
    BeneficiarySearchService,
    BeneficiaryStatsService,
    BeneficiaryManagementService,

    WeeklyTrackingService,

    BeneficiaryDocumentsService,
    DocumentValidationService,
    DocumentUploadService,
    DocumentVerificationService,
    DocumentDeletionService,
    DocumentQueryService,
    DocumentMimeTypeService,


    GoalsService,
    EmergencyContactsService,
  ],
  exports: [
    BeneficiariesService,
    WeeklyTrackingService,
    BeneficiaryDocumentsService,
    GoalsService,
    EmergencyContactsService,
  ],
})
export class BeneficiariesModule { }