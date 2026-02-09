import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';

import { BaseService } from '../../shared/services/base.service';
import { CloudinaryService } from '../../shared/services/cloudinary.service';

import { Program } from './entities/program.entity';
import { Project } from './entities/project.entity';

import { PaginationParams, PaginatedResponse } from '../../shared/interfaces/pagination.interface';

import { ProgramCategory, ProgramStatus } from '../../config/constants';
import { CreateProgramDTO } from './dto/create-program.dto';
import { UpdateProgramDTO } from './dto/update-program.dto';

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

  // ================= PUBLIC =================
  async findPublicPrograms(
    params: PaginationParams,
    category?: ProgramCategory,
  ): Promise<PaginatedResponse<Program>> {
    const where: FindOptionsWhere<Program> = {
      status: ProgramStatus.ACTIVE,
      ...(category && { category }),
    };

    return this.paginate(params, where, ['projects', 'impactMetrics']);
  }

  // ================= ADMIN =================
  async findAdminPrograms(
    params: PaginationParams,
    status?: ProgramStatus,
  ): Promise<PaginatedResponse<Program>> {
    const where: FindOptionsWhere<Program> = {
      ...(status && { status }),
    };

    return this.paginate(params, where, ['projects', 'impactMetrics', 'stories', 'donations']);
  }

  // ================= GET BY ID =================
  async findProgramById(id: string): Promise<Program | null> {
    return this.findOne(id, ['projects', 'impactMetrics', 'stories']);
  }

  // ================= CREATE =================
  async createProgram(
    dto: CreateProgramDTO,
    // eslint-disable-next-line no-undef
    coverImage?: Express.Multer.File,
    // eslint-disable-next-line no-undef
    logo?: Express.Multer.File,
  ): Promise<Program> {
    const { projects, ...programData } = dto;

    // 1️⃣ Create program
    const program = this.programRepository.create(programData);
    const savedProgram = await this.programRepository.save(program);

    // 2️⃣ Upload cover image
    if (coverImage) {
      const upload = await this.cloudinaryService.uploadProgramCover(savedProgram.id, coverImage);

      savedProgram.coverImage = upload.url;
      savedProgram.coverImagePublicId = upload.publicId;
    }

    // 3️⃣ Upload logo
    if (logo) {
      const upload = await this.cloudinaryService.uploadProgramLogo(savedProgram.id, logo);

      savedProgram.logo = upload.url;
      savedProgram.logoPublicId = upload.publicId;
    }

    await this.programRepository.save(savedProgram);

    // 4️⃣ Create projects
    if (projects?.length) {
      const projectEntities = projects.map((project) =>
        this.projectRepository.create({
          ...project,
          program: savedProgram,
        }),
      );

      await this.projectRepository.save(projectEntities);
    }

    return this.findProgramById(savedProgram.id) as Promise<Program>;
  }

  // ================= UPDATE =================
  async updateProgram(
    id: string,
    dto: UpdateProgramDTO,
    // eslint-disable-next-line no-undef
    coverImage?: Express.Multer.File,
    // eslint-disable-next-line no-undef
    logo?: Express.Multer.File,
  ): Promise<Program | null> {
    const program = await this.findOne(id);
    if (!program) {
      throw new NotFoundException('Program not found');
    }

    // 1️⃣ Update normal fields
    Object.assign(program, dto);

    // 2️⃣ Update cover image (Cloudinary)
    if (coverImage) {
      if (program.coverImagePublicId) {
        await this.cloudinaryService.deleteFile(program.coverImagePublicId);
      }

      const upload = await this.cloudinaryService.uploadProgramCover(id, coverImage);
      program.coverImage = upload.url;
      program.coverImagePublicId = upload.publicId;
    }

    // 3️⃣ Update logo (Cloudinary)
    if (logo) {
      if (program.logoPublicId) {
        await this.cloudinaryService.deleteFile(program.logoPublicId);
      }

      const upload = await this.cloudinaryService.uploadProgramLogo(id, logo);
      program.logo = upload.url;
      program.logoPublicId = upload.publicId;
    }

    // 4️⃣ Save & return
    await this.programRepository.save(program);
    return this.findProgramById(id);
  }

  // ================= UPDATE MEDIA =================
  // eslint-disable-next-line no-undef
  async updateProgramCover(programId: string, file: Express.Multer.File): Promise<Program> {
    const program = await this.findOne(programId);
    if (!program) throw new NotFoundException('Program not found');

    // delete old image
    if (program.coverImagePublicId) {
      await this.cloudinaryService.deleteFile(program.coverImagePublicId);
    }

    const upload = await this.cloudinaryService.uploadProgramCover(programId, file);

    program.coverImage = upload.url;
    program.coverImagePublicId = upload.publicId;

    return this.programRepository.save(program);
  }

  // eslint-disable-next-line no-undef
  async updateProgramLogo(programId: string, file: Express.Multer.File): Promise<Program> {
    const program = await this.findOne(programId);
    if (!program) throw new NotFoundException('Program not found');

    if (program.logoPublicId) {
      await this.cloudinaryService.deleteFile(program.logoPublicId);
    }

    const upload = await this.cloudinaryService.uploadProgramLogo(programId, file);

    program.logo = upload.url;
    program.logoPublicId = upload.publicId;

    return this.programRepository.save(program);
  }

  // ================= DEACTIVATE =================
  async deactivateProgram(id: string): Promise<Program | null> {
    await this.programRepository.update(id, {
      status: ProgramStatus.INACTIVE,
    });

    return this.findProgramById(id);
  }
}
