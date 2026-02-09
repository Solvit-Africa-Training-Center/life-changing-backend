<<<<<<< HEAD
import { Module } from '@nestjs/common';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';

@Module({
  controllers: [ProgramsController],
  providers: [ProgramsService]
})
export class ProgramsModule {}
=======
// src/modules/programs/programs.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';
import { Program } from './entities/program.entity';
import { Project } from './entities/project.entity';
import { ImpactMetric } from './entities/impact-metric.entity';

import { CloudinaryService } from '../../shared/services/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Program, Project, ImpactMetric])],
  controllers: [ProgramsController],
  providers: [ProgramsService, CloudinaryService],
  exports: [ProgramsService],
})
export class ProgramsModule {}
>>>>>>> origin/dev
