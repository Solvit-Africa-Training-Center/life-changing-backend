// src/modules/programs/services/program-project.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from '../entities/project.entity';
import { Program } from '../entities/program.entity';

@Injectable()
export class ProgramProjectService {
    constructor(
        @InjectRepository(Project)
        private readonly projectRepository: Repository<Project>,
    ) { }

    async createProjectsForProgram(
        program: Program,
        projectsData: Array<{
            name: { en: string; rw: string };
            description: { en: string; rw: string };
            budgetRequired: number;
            timeline: {
                start: string;
                end: string;
                milestones?: Array<{ date: string; description: string }>;
            };
            location: {
                districts: string[];
                sectors: string[];
            };
        }>
    ): Promise<Project[]> {
        const createdProjects: Project[] = [];

        for (const projectData of projectsData) {
            const project = new Project();
            project.name = projectData.name;
            project.description = projectData.description;
            project.budgetRequired = projectData.budgetRequired;
            project.budgetReceived = 0;
            project.budgetUtilized = 0;
            project.timeline = {
                start: new Date(projectData.timeline.start),
                end: new Date(projectData.timeline.end),
                milestones: projectData.timeline.milestones || [],
            };
            project.location = {
                districts: projectData.location.districts || [],
                sectors: projectData.location.sectors || [],
            };
            project.impactMetrics = {
                beneficiariesTarget: 0,
                beneficiariesReached: 0,
                successIndicators: [],
            };
            project.donationAllocationPercentage = 100;
            project.isActive = true;
            project.isFeatured = false;
            project.program = program;

            const savedProject = await this.projectRepository.save(project);
            createdProjects.push(savedProject);
        }

        return createdProjects;
    }
}