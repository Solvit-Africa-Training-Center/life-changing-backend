import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Project } from './entities/project.entity';
import { PaginationParams, PaginatedResponse } from '../../shared/interfaces/pagination.interface';
import { CloudinaryService } from '../../shared/services/cloudinary.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ================= GET PROJECTS BY PROGRAM =================
  async findProjectsByProgram(
    programId: string,
    params: PaginationParams,
  ): Promise<PaginatedResponse<Project>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;

    const sortBy = params.sortBy ?? 'createdAt';
    const sortOrder = params.sortOrder ?? 'DESC';

    const [data, total] = await this.projectRepository.findAndCount({
      where: {
        program: { id: programId },
      },
      relations: ['program', 'donations'],
      order: {
        [sortBy]: sortOrder,
      },
      take: limit,
      skip,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  // ================= PROJECT MEDIA =================
  // eslint-disable-next-line no-undef
  async uploadProjectMedia(
    programId: string,
    projectId: string,
    // eslint-disable-next-line no-undef
    file: Express.Multer.File,
  ): Promise<{ url: string; publicId: string }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['program'],
    });

    if (!project || project.program.id !== programId) {
      throw new NotFoundException('Project not found for this program');
    }

    return this.cloudinaryService.uploadProjectMedia(programId, projectId, file);
  }
}
