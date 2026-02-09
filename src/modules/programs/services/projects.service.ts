// src/modules/programs/services/projects.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudinaryService } from '../../../shared/services/cloudinary.service';
import { Project } from '../entities/project.entity';
import { Program } from '../entities/program.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ================= PROJECT COVER IMAGE =================
  async uploadProjectCover(
    programId: string,
    projectId: string,
    file: Express.Multer.File,
  ): Promise<Project> {
    // Verify program exists
    const program = await this.programRepository.findOne({ where: { id: programId } });
    if (!program) {
      throw new NotFoundException('Program not found');
    }

    // Verify project exists and belongs to program
    const project = await this.projectRepository.findOne({
      where: { id: projectId, program: { id: programId } },
    });

    if (!project) {
      throw new NotFoundException('Project not found or does not belong to this program');
    }

    // Delete old cover image if exists
    if (project.coverImagePublicId) {
      await this.cloudinaryService.deleteFile(project.coverImagePublicId);
    }

    // Upload new cover image to specific folder
    const upload = await this.cloudinaryService.uploadProjectCover(programId, projectId, file);

    // Update project
    project.coverImage = upload.url;
    project.coverImagePublicId = upload.publicId;

    return this.projectRepository.save(project);
  }

  // ================= PROJECT GALLERY =================
  async uploadToGallery(
    programId: string,
    projectId: string,
    file: Express.Multer.File,
    caption?: string,
  ): Promise<Project> {
    // Verify program exists
    const program = await this.programRepository.findOne({ where: { id: programId } });
    if (!program) {
      throw new NotFoundException('Program not found');
    }

    // Verify project exists and belongs to program
    const project = await this.projectRepository.findOne({
      where: { id: projectId, program: { id: programId } },
    });

    if (!project) {
      throw new NotFoundException('Project not found or does not belong to this program');
    }

    // Upload to gallery folder
    const upload = await this.cloudinaryService.uploadProjectGallery(programId, projectId, file);

    // Initialize gallery if needed
    if (!project.gallery) {
      project.gallery = [];
    }

    // Add to gallery
    project.gallery.push({
      url: upload.url,
      publicId: upload.publicId,
      caption: caption || 'Project image',
      type: upload.resourceType,
      uploadedAt: new Date(),
    });

    // If this is the first image, set it as cover
    if (!project.coverImage && upload.resourceType === 'image') {
      project.coverImage = upload.url;
      project.coverImagePublicId = upload.publicId;
    }

    return this.projectRepository.save(project);
  }

  // ================= DELETE GALLERY ITEM =================
  async deleteGalleryItem(
    programId: string,
    projectId: string,
    publicId: string,
  ): Promise<Project> {
    // Verify program exists
    const program = await this.programRepository.findOne({ where: { id: programId } });
    if (!program) {
      throw new NotFoundException('Program not found');
    }

    // Verify project exists and belongs to program
    const project = await this.projectRepository.findOne({
      where: { id: projectId, program: { id: programId } },
    });

    if (!project) {
      throw new NotFoundException('Project not found or does not belong to this program');
    }

    // Delete from Cloudinary
    await this.cloudinaryService.deleteFile(publicId);

    // Remove from gallery
    if (project.gallery) {
      project.gallery = project.gallery.filter(item => item.publicId !== publicId);
      
      // If deleted item was the cover image, set new cover (first image in gallery)
      if (project.coverImagePublicId === publicId) {
        const firstImage = project.gallery.find(item => item.type === 'image');
        if (firstImage) {
          project.coverImage = firstImage.url;
          project.coverImagePublicId = firstImage.publicId;
        } else {
          project.coverImage = null;
          project.coverImagePublicId = null;
        }
      }
    }

    return this.projectRepository.save(project);
  }

  // ================= GET PROJECT DETAILS =================
  async getProjectDetails(projectId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['program', 'donations'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Calculate completion percentage
    const budgetRequired = parseFloat(project.budgetRequired as any);
    const budgetReceived = parseFloat(project.budgetReceived as any);
    const completionPercentage = budgetRequired > 0 
      ? Math.round((budgetReceived / budgetRequired) * 100) 
      : 0;

    // Add computed fields
    (project as any).completionPercentage = completionPercentage;
    (project as any).remainingBudget = budgetRequired - budgetReceived;

    return project;
  }

  // ================= UPDATE DONATION ALLOCATION =================
  async updateDonationAllocation(
    projectId: string,
    percentage: number,
  ): Promise<Project> {
    if (percentage < 0 || percentage > 100) {
      throw new BadRequestException('Percentage must be between 0 and 100');
    }

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['program'],
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    project.donationAllocationPercentage = percentage;
    return this.projectRepository.save(project);
  }

  // ================= UPDATE PROJECT BUDGET =================
  async updateProjectBudget(
    projectId: string,
    updates: {
      budgetRequired?: number;
      budgetReceived?: number;
      budgetUtilized?: number;
    },
  ): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (updates.budgetRequired !== undefined) {
      project.budgetRequired = updates.budgetRequired;
    }
    if (updates.budgetReceived !== undefined) {
      project.budgetReceived = updates.budgetReceived;
    }
    if (updates.budgetUtilized !== undefined) {
      project.budgetUtilized = updates.budgetUtilized;
    }

    return this.projectRepository.save(project);
  }

  // ================= GET PROJECTS BY PROGRAM =================
  async getProjectsByProgram(
    programId: string,
    options?: {
      isActive?: boolean;
      isFeatured?: boolean;
    }
  ): Promise<Project[]> {
    const where: any = { program: { id: programId } };
    
    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }
    if (options?.isFeatured !== undefined) {
      where.isFeatured = options.isFeatured;
    }

    const projects = await this.projectRepository.find({
      where,
      relations: ['donations'],
      order: { createdAt: 'DESC' },
    });

    // Add computed fields to each project
    return projects.map(project => {
      const budgetRequired = parseFloat(project.budgetRequired as any);
      const budgetReceived = parseFloat(project.budgetReceived as any);
      const completionPercentage = budgetRequired > 0 
        ? Math.round((budgetReceived / budgetRequired) * 100) 
        : 0;

      return {
        ...project,
        completionPercentage,
        remainingBudget: budgetRequired - budgetReceived,
      };
    });
  }
}