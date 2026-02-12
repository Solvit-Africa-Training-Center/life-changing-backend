// src/modules/content/services/story-update.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from '../entities/story.entity';
import { UpdateStoryDTO } from '../dto/update-story.dto';
import { StoryValidationService } from './story-validation.service';

@Injectable()
export class StoryUpdateService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    private readonly validationService: StoryValidationService,
  ) {}

  async updateStory(
    storyId: string,
    dto: UpdateStoryDTO,
  ): Promise<Story> {
    const story = await this.validationService.validateStory(storyId);

    // Update program if provided
    if (dto.programId !== undefined) {
      story.program = await this.validationService.validateProgram(dto.programId);
    }

    // Update beneficiary if provided
    if (dto.beneficiaryId !== undefined) {
      story.beneficiaryId = dto.beneficiaryId;
      await this.validationService.validateBeneficiary(dto.beneficiaryId);
    }

    // Update basic fields
    if (dto.title !== undefined) story.title = dto.title;
    if (dto.content !== undefined) story.content = dto.content;
    if (dto.authorName !== undefined) story.authorName = dto.authorName;
    if (dto.authorRole !== undefined) story.authorRole = dto.authorRole;
    if (dto.isFeatured !== undefined) story.isFeatured = dto.isFeatured;
    if (dto.isPublished !== undefined) story.isPublished = dto.isPublished;
    if (dto.publishedDate !== undefined) story.publishedDate = new Date(dto.publishedDate);
    if (dto.language !== undefined) story.language = dto.language;
    if (dto.metadata !== undefined) {
      story.metadata = {
        ...story.metadata,
        ...dto.metadata,
      };
    }

    return this.storyRepository.save(story);
  }

  async incrementViewCount(storyId: string): Promise<Story> {
    const story = await this.validationService.validateStory(storyId);
    story.viewCount += 1;
    return this.storyRepository.save(story);
  }

  async incrementShareCount(storyId: string): Promise<Story> {
    const story = await this.validationService.validateStory(storyId);
    story.shareCount += 1;
    return this.storyRepository.save(story);
  }
}