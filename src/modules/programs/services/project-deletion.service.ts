// src/modules/programs/services/project-deletion.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from '../entities/project.entity';
import { ProjectValidationService } from './project-validation.service';
import { CloudinaryService } from '../../../shared/services/cloudinary.service';

@Injectable()
export class ProjectDeletionService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly validationService: ProjectValidationService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async deleteProject(programId: string, projectId: string): Promise<void> {
    const { project } = await this.validationService.validateProgramAndProject(programId, projectId);

    // Check for dependencies (donations)
    if (project.donations && project.donations.length > 0) {
      throw new BadRequestException(
        'Cannot delete project with existing donations. Archive the project instead.'
      );
    }

    // Delete all images from Cloudinary
    await this.deleteAllProjectImages(project);

    // Delete project from database
    await this.projectRepository.delete(projectId);
  }

  private async deleteAllProjectImages(project: Project): Promise<void> {
    const deletePromises: Promise<void>[] = [];

    // Delete cover image
    if (project.coverImagePublicId) {
      deletePromises.push(this.cloudinaryService.deleteFile(project.coverImagePublicId));
    }

    // Delete gallery images
    if (project.gallery && project.gallery.length > 0) {
      project.gallery.forEach(item => {
        if (item.publicId) {
          deletePromises.push(this.cloudinaryService.deleteFile(item.publicId));
        }
      });
    }

    await Promise.all(deletePromises);
  }
}