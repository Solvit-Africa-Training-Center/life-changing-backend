// src/modules/programs/programs.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramsService } from './services/programs.service';
import { Program } from './entities/program.entity';
import { Project } from './entities/project.entity';
import { ImpactMetric } from './entities/impact-metric.entity';

import { CloudinaryService } from '../../shared/services/cloudinary.service';
import { ProgramsController } from './controllers/programs.controller';
import { ProjectsService } from './services/projects.service';
import { ProjectsController } from './controllers/projects.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Program, Project, ImpactMetric])],
  controllers: [ProgramsController, ProjectsController],
  providers: [ProgramsService, ProjectsService, CloudinaryService],
  exports: [ProgramsService, ProjectsService],
})
export class ProgramsModule {}