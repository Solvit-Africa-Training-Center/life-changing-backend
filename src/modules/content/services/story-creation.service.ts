// src/modules/content/services/story-creation.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from '../entities/story.entity';
import { CreateStoryDTO } from '../dto/create-story.dto';
import { StoryValidationService } from './story-validation.service';
import { StoryMediaService } from './story-media.service';
import { Language } from '../../../config/constants';

@Injectable()
export class StoryCreationService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    private readonly validationService: StoryValidationService,
    private readonly mediaService: StoryMediaService,
  ) {}

  async createStory(
    dto: CreateStoryDTO,
  ): Promise<Story> {
    // Validate program and beneficiary if provided
    const program = await this.validationService.validateProgram(dto.programId);
    const beneficiary = await this.validationService.validateBeneficiary(dto.beneficiaryId);

    // Create story entity
    const story = this.storyRepository.create({
      title: dto.title,
      content: dto.content,
      authorName: dto.authorName,
      authorRole: dto.authorRole,
      program,
      beneficiaryId: dto.beneficiaryId,
      isFeatured: dto.isFeatured || false,
      isPublished: dto.isPublished ?? true,
      publishedDate: dto.publishedDate ? new Date(dto.publishedDate) : new Date(),
      language: dto.language || Language.EN,
      viewCount: 0,
      shareCount: 0,
      media: [],
      metadata: dto.metadata || { tags: [], location: '', duration: 0 },
    });

    return this.storyRepository.save(story);
  }

  async createStoryWithMedia(
    dto: CreateStoryDTO,
    mediaFiles?: Express.Multer.File[],
    mediaTypes?: ('image' | 'video')[],
    captions?: string[],
  ): Promise<Story> {
    // First create the story
    const story = await this.createStory(dto);

    // Upload media files if provided
    if (mediaFiles && mediaFiles.length > 0) {
      await this.mediaService.addMultipleMedia(
        story.id,
        mediaFiles,
        mediaTypes || [],
        captions || [],
      );
    }

    // Return updated story with media
    return this.validationService.validateStory(story.id, ['program']);
  }
}