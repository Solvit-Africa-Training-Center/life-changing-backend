import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../../shared/services/base.service';
import { CloudinaryService } from '../../../shared/services/cloudinary.service';
import { Program } from '../entities/program.entity';
import { Project } from '../entities/project.entity';
import { CreateProgramDTO } from '../dto/create-program.dto';
import { UpdateProgramDTO } from '../dto/update-program.dto';
import { ProgramCategory, ProgramStatus } from '../../../config/constants';
import { PaginationParams } from '../../../shared/interfaces/pagination.interface';

@Injectable()
export class ProgramsService extends BaseService<Program> {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,

    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    private readonly cloudinaryService: CloudinaryService,
  ) {
    super(programRepository);
  }

  // ================= PUBLIC METHODS =================
  async findPublicPrograms(
    params: PaginationParams,
    category?: ProgramCategory,
  ) {
    const where: any = {
      status: ProgramStatus.ACTIVE,
    };
    
    if (category) {
      where.category = category;
    }

    // Use the inherited paginate method from BaseService
    return this.paginate(params, where, ['projects']);
  }

  // ================= ADMIN METHODS =================
  async findAdminPrograms(
    params: PaginationParams,
    status?: ProgramStatus,
  ) {
    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    // Use the inherited paginate method from BaseService
    return this.paginate(params, where, ['projects', 'beneficiaries']);
  }

  // ================= GET BY ID =================
  async findProgramById(id: string): Promise<Program> {
    // Use the inherited findOne method from BaseService
    const program = await this.findOne(id, ['projects', 'beneficiaries', 'impactMetrics', 'stories', 'donations']);

    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }

    return program;
  }

  // ================= CREATE =================
  async createProgram(
    dto: CreateProgramDTO,
    coverImage?: Express.Multer.File,
    logo?: Express.Multer.File,
  ): Promise<Program> {
    // 1. Create program entity directly
    const program = new Program();
    program.name = dto.name;
    program.description = dto.description;
    program.category = dto.category;
    program.sdgAlignment = dto.sdgAlignment;
    program.kpiTargets = dto.kpiTargets;
    program.startDate = new Date(dto.startDate);
    program.budget = dto.budget;
    program.status = dto.status || ProgramStatus.ACTIVE;
    program.fundsAllocated = 0;
    program.fundsUtilized = 0;
    program.sortOrder = 0;

    // Handle endDate - only set if provided and not empty
    if (dto.endDate && dto.endDate.trim() !== '') {
      program.endDate = new Date(dto.endDate);
    }

    // Save program first
    const savedProgram = await this.programRepository.save(program);

    // 2. Upload cover image
    if (coverImage) {
      const upload = await this.cloudinaryService.uploadProgramCover(savedProgram.id, coverImage);
      savedProgram.coverImage = upload.url;
      savedProgram.coverImagePublicId = upload.publicId;
    }

    // 3. Upload logo
    if (logo) {
      const upload = await this.cloudinaryService.uploadProgramLogo(savedProgram.id, logo);
      savedProgram.logo = upload.url;
      savedProgram.logoPublicId = upload.publicId;
    }

    // Save program with images
    await this.programRepository.save(savedProgram);

    // 4. Create projects if any
    if (dto.projects?.length) {
      for (const projectData of dto.projects) {
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
        project.location = projectData.location;
        project.impactMetrics = {
          beneficiariesTarget: 0,
          beneficiariesReached: 0,
          successIndicators: [],
        };
        project.donationAllocationPercentage = 100;
        project.isActive = true;
        project.isFeatured = false;
        project.program = savedProgram;

        await this.projectRepository.save(project);
      }
    }

    // Return the full program with relations
    return this.findProgramById(savedProgram.id);
  }

  // ================= UPDATE =================
  async updateProgram(
    id: string,
    dto: UpdateProgramDTO,
    coverImage?: Express.Multer.File,
    logo?: Express.Multer.File,
  ): Promise<Program> {
    const program = await this.findProgramById(id);

    // Update basic fields
    if (dto.name !== undefined) program.name = dto.name;
    if (dto.description !== undefined) program.description = dto.description;
    if (dto.category !== undefined) program.category = dto.category;
    if (dto.sdgAlignment !== undefined) program.sdgAlignment = dto.sdgAlignment;
    if (dto.kpiTargets !== undefined) program.kpiTargets = dto.kpiTargets;
    if (dto.budget !== undefined) program.budget = dto.budget;
    if (dto.status !== undefined) program.status = dto.status;
    
    // Update dates
    if (dto.startDate) program.startDate = new Date(dto.startDate);
    
    // Handle endDate properly
    if (dto.endDate !== undefined) {
      if (dto.endDate === null || dto.endDate === '') {
        program.endDate = undefined;
      } else {
        program.endDate = new Date(dto.endDate);
      }
    }

    // Update cover image if provided
    if (coverImage) {
      // Delete old image if exists
      if (program.coverImagePublicId) {
        await this.cloudinaryService.deleteFile(program.coverImagePublicId);
      }
      
      const upload = await this.cloudinaryService.uploadProgramCover(id, coverImage);
      program.coverImage = upload.url;
      program.coverImagePublicId = upload.publicId;
    }

    // Update logo if provided
    if (logo) {
      // Delete old logo if exists
      if (program.logoPublicId) {
        await this.cloudinaryService.deleteFile(program.logoPublicId);
      }
      
      const upload = await this.cloudinaryService.uploadProgramLogo(id, logo);
      program.logo = upload.url;
      program.logoPublicId = upload.publicId;
    }

    // Use the inherited update method from BaseService
    return this.programRepository.save(program);
  }

  // ================= DELETE =================
  async deleteProgram(id: string): Promise<void> {
    const program = await this.findProgramById(id);

    // Delete images from Cloudinary
    if (program.coverImagePublicId) {
      await this.cloudinaryService.deleteFile(program.coverImagePublicId);
    }
    if (program.logoPublicId) {
      await this.cloudinaryService.deleteFile(program.logoPublicId);
    }

    // Use the inherited delete method from BaseService
    await this.delete(id);
  }

  // ================= STATISTICS =================
  async getProgramWithStats(id: string): Promise<any> {
    const program = await this.findProgramById(id);

    // Calculate statistics
    const beneficiaryCount = program.beneficiaries?.length || 0;
    const totalDonations = program.donations?.reduce((sum, donation) => 
      sum + (parseFloat(donation.amount as any) || 0), 0) || 0;
    
    const projects = program.projects?.map(project => ({
      id: project.id,
      name: project.name,
      budgetRequired: parseFloat(project.budgetRequired as any),
      budgetReceived: parseFloat(project.budgetReceived as any),
      completionPercentage: project.budgetRequired > 0 
        ? Math.round((parseFloat(project.budgetReceived as any) / parseFloat(project.budgetRequired as any)) * 100) 
        : 0,
    }));

    return {
      ...program,
      statistics: {
        beneficiaryCount,
        totalDonations,
        fundsUtilizationPercentage: program.budget > 0 
          ? Math.round((parseFloat(program.fundsUtilized as any) / parseFloat(program.budget as any)) * 100) 
          : 0,
        projects,
      },
    };
  }
}