import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { BeneficiariesController } from './controllers/beneficiaries.controller';
// import { DocumentsController } from './controllers/documents.controller';
// import { TrackingsController } from './controllers/trackings.controller';
// import { GoalsController } from './controllers/goals.controller';
import { BeneficiariesService } from './services/beneficiaries.service';
// import { DocumentsService } from './services/documents.service';
// import { TrackingsService } from './services/trackings.service';
// import { GoalsService } from './services/goals.service';
import { Beneficiary } from './entities/beneficiary.entity';
import { BeneficiaryDocument } from './entities/beneficiary-document.entity';
import { WeeklyTracking } from './entities/weekly-tracking.entity';
import { Goal } from './entities/goal.entity';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { UsersModule } from '../users/users.module';
import { ProgramsModule } from '../programs/programs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Beneficiary, 
      BeneficiaryDocument, 
      WeeklyTracking, 
      Goal, 
      EmergencyContact
    ]),
    UsersModule,
    ProgramsModule,
  ],
  controllers: [
    BeneficiariesController,
    DocumentsController,
    TrackingsController,
    GoalsController,
  ],
  providers: [
    BeneficiariesService,
    DocumentsService,
    TrackingsService,
    GoalsService,
  ],
  exports: [BeneficiariesService],
})
export class BeneficiariesModule {}