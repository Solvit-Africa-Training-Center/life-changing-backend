// src/modules/programs/services/program-update.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Program } from '../entities/program.entity';
import { UpdateProgramDTO } from '../dto/update-program.dto';
import { ProgramMediaService } from './program-media.service';
import { ProgramQueryService } from './program-query.service';

@Injectable()
export class ProgramUpdateService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    private readonly queryService: ProgramQueryService,
    private readonly mediaService: ProgramMediaService,
  ) {}

  async updateProgram(
    id: string,
    dto: UpdateProgramDTO,
    coverImage?: Express.Multer.File,
    logo?: Express.Multer.File,
  ): Promise<Program> {
    const program = await this.queryService.findProgramById(id);

    // Update basic fields
    this.updateBasicFields(program, dto);
    
    // Handle media updates
    await this.handleMediaUpdates(program, coverImage, logo);

    // Save and return updated program
    return await this.programRepository.save(program);
  }

  private updateBasicFields(program: Program, dto: UpdateProgramDTO): void {
    if (dto.name !== undefined) program.name = dto.name;
    if (dto.description !== undefined) program.description = dto.description;
    if (dto.category !== undefined) program.category = dto.category;
    if (dto.sdgAlignment !== undefined) program.sdgAlignment = dto.sdgAlignment;
    if (dto.kpiTargets !== undefined) program.kpiTargets = dto.kpiTargets;
    if (dto.budget !== undefined) program.budget = dto.budget;
    if (dto.status !== undefined) program.status = dto.status;
    
    if (dto.startDate) program.startDate = new Date(dto.startDate);
    
    if (dto.endDate !== undefined) {
      if (dto.endDate === null || dto.endDate === '') {
        program.endDate = undefined;
      } else {
        program.endDate = new Date(dto.endDate);
      }
    }
  }

  private async handleMediaUpdates(
    program: Program,
    coverImage?: Express.Multer.File,
    logo?: Express.Multer.File,
  ): Promise<void> {
    const mediaUpdates: Promise<void>[] = [];

    if (coverImage) {
      mediaUpdates.push(this.updateCoverImageWithCleanup(program, coverImage));
    }

    if (logo) {
      mediaUpdates.push(this.updateLogoWithCleanup(program, logo));
    }

    if (mediaUpdates.length > 0) {
      await Promise.all(mediaUpdates);
    }
  }

  private async updateCoverImageWithCleanup(
    program: Program,
    coverImage: Express.Multer.File
  ): Promise<void> {
    if (program.coverImagePublicId) {
      await this.mediaService.deleteImage(program.coverImagePublicId);
    }
    
    const upload = await this.mediaService.uploadCoverImage(program.id, coverImage);
    program.coverImage = upload.url;
    program.coverImagePublicId = upload.publicId;
  }

  private async updateLogoWithCleanup(
    program: Program,
    logo: Express.Multer.File
  ): Promise<void> {
    if (program.logoPublicId) {
      await this.mediaService.deleteImage(program.logoPublicId);
    }
    
    const upload = await this.mediaService.uploadLogo(program.id, logo);
    program.logo = upload.url;
    program.logoPublicId = upload.publicId;
  }
}