// src/modules/content/services/story-validation.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from '../entities/story.entity';
import { Program } from '../../programs/entities/program.entity';
import { Beneficiary } from '../../beneficiaries/entities/beneficiary.entity';

@Injectable()
export class StoryValidationService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    @InjectRepository(Beneficiary)
    private readonly beneficiaryRepository: Repository<Beneficiary>,
  ) {}

  async validateStory(storyId: string, relations: string[] = []): Promise<Story> {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations,
    });

    if (!story) {
      throw new NotFoundException(`Story with ID ${storyId} not found`);
    }

    return story;
  }

  async validateProgram(programId?: string): Promise<Program | null> {
    if (!programId) return null;
    
    const program = await this.programRepository.findOne({
      where: { id: programId },
    });

    if (!program) {
      throw new NotFoundException(`Program with ID ${programId} not found`);
    }

    return program;
  }

  async validateBeneficiary(beneficiaryId?: string): Promise<Beneficiary | null> {
    if (!beneficiaryId) return null;
    
    const beneficiary = await this.beneficiaryRepository.findOne({
      where: { id: beneficiaryId },
    });

    if (!beneficiary) {
      throw new NotFoundException(`Beneficiary with ID ${beneficiaryId} not found`);
    }

    return beneficiary;
  }

  validateMediaFile(file: Express.Multer.File, mediaType: 'image' | 'video'): void {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (mediaType === 'image') {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedMimes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Image type ${file.mimetype} not allowed. Allowed types: JPEG, PNG, WebP, GIF`
        );
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException('Image size must not exceed 10MB');
      }
    } else if (mediaType === 'video') {
      const allowedMimes = ['video/mp4', 'video/quicktime', 'video/webm'];
      if (!allowedMimes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Video type ${file.mimetype} not allowed. Allowed types: MP4, MOV, WebM`
        );
      }
      if (file.size > 100 * 1024 * 1024) {
        throw new BadRequestException('Video size must not exceed 100MB');
      }
    }
  }

  validateStoryDates(publishedDate: Date): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (publishedDate > today) {
      throw new BadRequestException('Published date cannot be in the future');
    }
  }
}