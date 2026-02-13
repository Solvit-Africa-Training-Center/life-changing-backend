// src/modules/programs/services/project-media.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CloudinaryService } from '../../../shared/services/cloudinary.service';
import { Project } from '../entities/project.entity';
import { ProjectValidationService } from './project-validation.service';

@Injectable()
export class ProjectMediaService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly validationService: ProjectValidationService,
  ) { }

  async uploadProjectCover(
    programId: string,
    projectId: string,
    file: Express.Multer.File,
  ): Promise<Project> {
    const { project } = await this.validationService.validateProgramAndProject(programId, projectId);

    await this.deleteExistingCoverImage(project);

    const upload = await this.cloudinaryService.uploadProjectCover(programId, projectId, file);

    project.coverImage = upload.url;
    project.coverImagePublicId = upload.publicId;

    return this.projectRepository.save(project);
  }

  async uploadToGallery(
    programId: string,
    projectId: string,
    file: Express.Multer.File,
    caption?: string,
  ): Promise<Project> {
    const { project } = await this.validationService.validateProgramAndProject(programId, projectId);

    const upload = await this.cloudinaryService.uploadProjectGallery(programId, projectId, file);

    this.initializeGalleryIfNeeded(project);

    this.addToGallery(project, upload, caption);

    this.setFirstImageAsCoverIfNeeded(project, upload);

    return this.projectRepository.save(project);
  }

  async updateGalleryCaptions(
    programId: string,
    projectId: string,
    items: Array<{ publicId: string; caption: string }>
  ): Promise<Project> {
    const { project } = await this.validationService.validateProgramAndProject(programId, projectId);

    if (!project.gallery) {
      project.gallery = [];
    }

    items.forEach(({ publicId, caption }) => {
      const item = project.gallery?.find(g => g.publicId === publicId);
      if (item) {
        item.caption = caption;
      }
    });

    return this.projectRepository.save(project);
  }
  async deleteGalleryItem(
    programId: string,
    projectId: string,
    publicId: string,
  ): Promise<Project> {
    const { project } = await this.validationService.validateProgramAndProject(programId, projectId);

    await this.cloudinaryService.deleteFile(publicId);

    this.removeFromGallery(project, publicId);

    this.updateCoverImageIfDeleted(project, publicId);

    return this.projectRepository.save(project);
  }

  private async deleteExistingCoverImage(project: Project): Promise<void> {
    if (project.coverImagePublicId) {
      await this.cloudinaryService.deleteFile(project.coverImagePublicId);
    }
  }

  private initializeGalleryIfNeeded(project: Project): void {
    if (!project.gallery) {
      project.gallery = [];
    }
  }

  private addToGallery(
    project: Project,
    upload: any,
    caption?: string
  ): void {
    project.gallery.push({
      url: upload.url,
      publicId: upload.publicId,
      caption: caption || 'Project image',
      type: upload.resourceType,
      uploadedAt: new Date(),
    });
  }

  private setFirstImageAsCoverIfNeeded(project: Project, upload: any): void {
    if (!project.coverImage && upload.resourceType === 'image') {
      project.coverImage = upload.url;
      project.coverImagePublicId = upload.publicId;
    }
  }

  private removeFromGallery(project: Project, publicId: string): void {
    if (project.gallery) {
      project.gallery = project.gallery.filter(item => item.publicId !== publicId);
    }
  }

  private updateCoverImageIfDeleted(project: Project, deletedPublicId: string): void {
    if (project.coverImagePublicId === deletedPublicId) {
      const firstImage = project.gallery?.find(item => item.type === 'image');
      if (firstImage) {
        project.coverImage = firstImage.url;
        project.coverImagePublicId = firstImage.publicId;
      } else {
        project.coverImage = null;
        project.coverImagePublicId = null;
      }
    }
  }
}