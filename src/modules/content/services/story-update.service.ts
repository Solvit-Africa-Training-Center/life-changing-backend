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
  ) { }

  async updateStory(storyId: string, dto: UpdateStoryDTO): Promise<Story> {
    const story = await this.validationService.validateStory(storyId, ['program', 'beneficiary']);

    // Update program if provided
    if (dto.programId !== undefined) {
      story.program = dto.programId
        ? await this.validationService.validateProgram(dto.programId)
        : null;
    }

    // Update beneficiary if provided
    if (dto.beneficiaryId !== undefined) {
      story.beneficiary = dto.beneficiaryId
        ? await this.validationService.validateBeneficiary(dto.beneficiaryId)
        : null;
    }

    // Update basic fields
    if (dto.title !== undefined) story.title = dto.title;
    if (dto.content !== undefined) story.content = dto.content;
    if (dto.authorName !== undefined) story.authorName = dto.authorName;
    if (dto.authorRole !== undefined) story.authorRole = dto.authorRole;
    if (dto.isFeatured !== undefined) story.isFeatured = dto.isFeatured;
    if (dto.isPublished !== undefined) story.isPublished = dto.isPublished;

    // Update published date
    if (dto.publishedDate !== undefined) {
      const publishedDate = new Date(dto.publishedDate);
      this.validationService.validateStoryDates(publishedDate);
      story.publishedDate = publishedDate;
    }

    if (dto.language !== undefined) story.language = dto.language;

    // Update metadata (merge with existing)
    if (dto.metadata !== undefined) {
      story.metadata = {
        ...(story.metadata || {}),
        ...dto.metadata,
        // Ensure tags are properly merged if needed
        tags: dto.metadata.tags || story.metadata?.tags || [],
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

  async toggleFeatured(storyId: string): Promise<Story> {
    const story = await this.validationService.validateStory(storyId);
    story.isFeatured = !story.isFeatured;
    return this.storyRepository.save(story);
  }

  async togglePublished(storyId: string): Promise<Story> {
    const story = await this.validationService.validateStory(storyId);
    story.isPublished = !story.isPublished;
    return this.storyRepository.save(story);
  }

  async bulkUpdateStories(
    storyIds: string[],
    updates: Partial<Pick<Story, 'isPublished' | 'isFeatured' | 'language'>>,
  ): Promise<number> {
    const result = await this.storyRepository
      .createQueryBuilder()
      .update(Story)
      .set(updates)
      .whereInIds(storyIds)
      .execute();

    return result.affected || 0;
  }
}