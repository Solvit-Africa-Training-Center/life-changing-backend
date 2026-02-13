// src/modules/programs/services/project-update.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from '../entities/project.entity';
import { UpdateProjectDTO } from '../dto/update-project.dto';
import { ProjectValidationService } from './project-validation.service';
import { ProjectMediaService } from './project-media.service';
import { CloudinaryService } from '../../../shared/services/cloudinary.service';

@Injectable()
export class ProjectUpdateService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly validationService: ProjectValidationService,
    private readonly mediaService: ProjectMediaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async updateProject(
    programId: string,
    projectId: string,
    dto: UpdateProjectDTO,
  ): Promise<Project> {
    const { project } = await this.validationService.validateProgramAndProject(programId, projectId);

    // Update basic fields
    this.updateBasicFields(project, dto);
    
    // Update timeline with date conversion
    if (dto.timeline) {
      project.timeline = {
        ...dto.timeline,
        start: new Date(dto.timeline.start),
        end: new Date(dto.timeline.end),
        milestones: dto.timeline.milestones || [],
      };
    }

    // Update boolean fields
    if (dto.isActive !== undefined) project.isActive = dto.isActive;
    if (dto.isFeatured !== undefined) project.isFeatured = dto.isFeatured;

    return this.projectRepository.save(project);
  }

  async updateProjectWithMedia(
    programId: string,
    projectId: string,
    dto: UpdateProjectDTO,
    coverImage?: Express.Multer.File,
    galleryFiles?: Express.Multer.File[],
    galleryCaptions?: string[],
    updateGalleryItems?: Array<{ publicId: string; caption: string }>,
    removeGalleryItems?: string[],
  ): Promise<Project> {
    const { project } = await this.validationService.validateProgramAndProject(programId, projectId);

    // 1. Update basic fields
    this.updateBasicFields(project, dto);
    
    // 2. Update timeline
    if (dto.timeline) {
      project.timeline = {
        ...dto.timeline,
        start: new Date(dto.timeline.start),
        end: new Date(dto.timeline.end),
        milestones: dto.timeline.milestones || [],
      };
    }

    // 3. Update boolean fields
    if (dto.isActive !== undefined) project.isActive = dto.isActive;
    if (dto.isFeatured !== undefined) project.isFeatured = dto.isFeatured;

    // 4. Handle cover image update/replacement
    if (coverImage) {
      await this.updateCoverImage(project, programId, coverImage);
    }

    // 5. Remove gallery items
    if (removeGalleryItems && removeGalleryItems.length > 0) {
      await this.removeGalleryItems(project, removeGalleryItems);
    }

    // 6. Update gallery item captions
    if (updateGalleryItems && updateGalleryItems.length > 0) {
      this.updateGalleryCaptions(project, updateGalleryItems);
    }

    // 7. Add new gallery items
    if (galleryFiles && galleryFiles.length > 0) {
      await this.addGalleryItems(project, programId, galleryFiles, galleryCaptions || []);
    }

    return this.projectRepository.save(project);
  }

  private updateBasicFields(project: Project, dto: UpdateProjectDTO): void {
    if (dto.name !== undefined) project.name = dto.name;
    if (dto.description !== undefined) project.description = dto.description;
    if (dto.budgetRequired !== undefined) project.budgetRequired = dto.budgetRequired;
    if (dto.location !== undefined) project.location = dto.location;
    if (dto.impactMetrics !== undefined) {
      project.impactMetrics = {
        ...project.impactMetrics,
        ...dto.impactMetrics,
      };
    }
  }

  private async updateCoverImage(
    project: Project,
    programId: string,
    file: Express.Multer.File
  ): Promise<void> {
    // Delete old cover image if exists
    if (project.coverImagePublicId) {
      await this.cloudinaryService.deleteFile(project.coverImagePublicId);
    }

    // Upload new cover image
    const upload = await this.cloudinaryService.uploadProjectCover(programId, project.id, file);
    project.coverImage = upload.url;
    project.coverImagePublicId = upload.publicId;
  }

  private async removeGalleryItems(
    project: Project,
    publicIds: string[]
  ): Promise<void> {
    if (!project.gallery) return;

    // Delete from Cloudinary
    await this.cloudinaryService.deleteFiles(publicIds);

    // Remove from project gallery
    project.gallery = project.gallery.filter(item => !publicIds.includes(item.publicId));
  }

  private updateGalleryCaptions(
    project: Project,
    items: Array<{ publicId: string; caption: string }>
  ): void {
    if (!project.gallery) return;

    items.forEach(({ publicId, caption }) => {
      const item = project.gallery?.find(g => g.publicId === publicId);
      if (item) {
        item.caption = caption;
      }
    });
  }

  private async addGalleryItems(
    project: Project,
    programId: string,
    files: Express.Multer.File[],
    captions: string[]
  ): Promise<void> {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const caption = captions[i] || `Gallery item ${project.gallery?.length + i + 1}`;
      
      await this.mediaService.uploadToGallery(programId, project.id, file, caption);
    }
    
    // Refresh project data
    const updated = await this.validationService.validateProjectExists(project.id);
    project.gallery = updated.gallery;
  }
}