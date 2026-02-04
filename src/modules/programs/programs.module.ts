import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';

import { Program } from './entities/program.entity';
import { Project } from './entities/project.entity';
import { ImpactMetric } from './entities/impact-metric.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Program, Project, ImpactMetric])],
  controllers: [ProgramsController],
  providers: [ProgramsService],
  exports: [ProgramsService],
})
export class ProgramsModule {}
