// src/modules/programs/programs.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramsService } from './services/programs.service';
import { Program } from './entities/program.entity';
import { Project } from './entities/project.entity';
import { ImpactMetric } from './entities/impact-metric.entity';

import { CloudinaryService } from '../../shared/services/cloudinary.service';

import { ProgramsController } from './controllers/programs.controller';
import { ProjectsController } from './controllers/projects.controller';
import { ProgramQueryService } from './services/program-query.service';
import { ProgramMediaService } from './services/program-media.service';
import { ProgramProjectService } from './services/program-project.service';
import { ProgramCreationService } from './services/program-creation.service';
import { ProgramUpdateService } from './services/program-update.service';
import { ProgramStatsService } from './services/program-stats.service';
import { ProgramDeletionService } from './services/program-deletion.service';
import { ProjectsService } from './services/projects.service';
import { ProjectCreationService } from './services/project-creation.service';
import { ProjectUpdateService } from './services/project-update.service';
import { ProjectDeletionService } from './services/project-deletion.service';
import { ProjectValidationService } from './services/project-validation.service';
import { ProjectMediaService } from './services/project-media.service';
import { ProjectBudgetService } from './services/project-budget.service';
import { ProjectQueryService } from './services/project-query.service';


@Module({
  imports: [TypeOrmModule.forFeature([Program, Project, ImpactMetric])],
  controllers: [ProgramsController, ProjectsController],
  providers: [
    ProgramsService,

    ProgramQueryService,
    ProgramMediaService,
    ProgramProjectService,
    ProgramCreationService,
    ProgramUpdateService,
    ProgramStatsService,
    ProgramDeletionService,

  

    ProjectsService,
    ProjectCreationService,
    ProjectUpdateService,
    ProjectDeletionService,
    ProjectValidationService,
    ProjectMediaService,
    ProjectBudgetService,
    ProjectQueryService,
    CloudinaryService],
  exports: [ProgramsService, ProjectsService],
})
export class ProgramsModule { }