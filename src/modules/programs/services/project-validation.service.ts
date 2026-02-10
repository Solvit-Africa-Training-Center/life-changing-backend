// src/modules/programs/services/project-validation.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from '../entities/project.entity';
import { Program } from '../entities/program.entity';

@Injectable()
export class ProjectValidationService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async validateProgramAndProject(programId: string, projectId: string): Promise<{
    program: Program;
    project: Project;
  }> {
    const program = await this.validateProgramExists(programId);
    const project = await this.validateProjectBelongsToProgram(programId, projectId);
    
    return { program, project };
  }

  async validateProgramExists(programId: string): Promise<Program> {
    const program = await this.programRepository.findOne({ where: { id: programId } });
    if (!program) {
      throw new NotFoundException('Program not found');
    }
    return program;
  }

  async validateProjectBelongsToProgram(programId: string, projectId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId, program: { id: programId } },
    });

    if (!project) {
      throw new NotFoundException('Project not found or does not belong to this program');
    }

    return project;
  }

  async validateProjectExists(projectId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }
}