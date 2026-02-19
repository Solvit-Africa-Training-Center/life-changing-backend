// src/modules/content/services/stories.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from '../entities/story.entity';
import { BaseService } from '../../../shared/services/base.service';
import { PaginationParams, PaginatedResponse } from '../../../shared/interfaces/pagination.interface';

import { StoryValidationService } from './story-validation.service';
import { StoryCreationService } from './story-creation.service';
import { StoryUpdateService } from './story-update.service';
import { StoryMediaService } from './story-media.service';
import { StoryQueryService } from './story-query.service';
import { StoryDeletionService } from './story-deletion.service';
import { StoryStatsService } from './story-stats.service';

import { CreateStoryDTO } from '../dto/create-story.dto';
import { UpdateStoryDTO } from '../dto/update-story.dto';
import { StoryFilterDto } from '../dto/story-filter.dto';

@Injectable()
export class StoriesService extends BaseService<Story> {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    private readonly validationService: StoryValidationService,
    private readonly creationService: StoryCreationService,
    private readonly updateService: StoryUpdateService,
    private readonly mediaService: StoryMediaService,
    private readonly queryService: StoryQueryService,
    private readonly deletionService: StoryDeletionService,
    private readonly statsService: StoryStatsService,
  ) {
    super(storyRepository);
  }

  // ================= CREATION =================
  async createStory(dto: CreateStoryDTO): Promise<Story> {
    return this.creationService.createStory(dto);
  }

  async createStoryWithMedia(
    dto: CreateStoryDTO,
    mediaFiles?: Express.Multer.File[],
    mediaTypes?: ('image' | 'video')[],
    captions?: string[],
  ): Promise<Story> {
    return this.creationService.createStoryWithMedia(dto, mediaFiles, mediaTypes, captions);
  }

  // ================= UPDATE =================
  async updateStory(storyId: string, dto: UpdateStoryDTO): Promise<Story> {
    return this.updateService.updateStory(storyId, dto);
  }

  async incrementViewCount(storyId: string): Promise<Story> {
    return this.updateService.incrementViewCount(storyId);
  }

  async incrementShareCount(storyId: string): Promise<Story> {
    return this.updateService.incrementShareCount(storyId);
  }

  // ================= MEDIA =================
  async addMedia(
    storyId: string,
    file: Express.Multer.File,
    mediaType: 'image' | 'video',
    caption?: string,
  ): Promise<Story> {
    return this.mediaService.addMedia(storyId, file, mediaType, caption);
  }

  async addMultipleMedia(
    storyId: string,
    files: Express.Multer.File[],
    mediaTypes: ('image' | 'video')[],
    captions: string[],
  ): Promise<Story> {
    return this.mediaService.addMultipleMedia(storyId, files, mediaTypes, captions);
  }

  async removeMedia(storyId: string, mediaUrl: string): Promise<Story> {
    return this.mediaService.removeMedia(storyId, mediaUrl);
  }

  async updateMediaCaption(storyId: string, mediaUrl: string, caption: string): Promise<Story> {
    return this.mediaService.updateMediaCaption(storyId, mediaUrl, caption);
  }

  async updateStoryWithMedia(
    storyId: string,
    dto: UpdateStoryDTO,
    mediaFiles?: Express.Multer.File[],
    mediaTypes?: ('image' | 'video')[],
    captions?: string[],
    mediaUpdates?: { publicId: string; caption: string }[],
    mediaToRemove?: string[],
  ): Promise<Story> {
    // First update the story basic info
    const updatedStory = await this.updateService.updateStory(storyId, dto);

    // Handle media removals
    if (mediaToRemove && mediaToRemove.length > 0) {
      await this.mediaService.removeMultipleMedia(storyId, mediaToRemove);
    }

    // Handle media caption updates
    if (mediaUpdates && mediaUpdates.length > 0) {
      await this.mediaService.updateMultipleMediaCaptions(storyId, mediaUpdates);
    }

    // Add new media files
    if (mediaFiles && mediaFiles.length > 0) {
      await this.mediaService.addMultipleMedia(
        storyId,
        mediaFiles,
        mediaTypes || [],
        captions || [],
      );
    }

    // Return the fully updated story
    return this.validationService.validateStory(storyId, ['program', 'beneficiary']);
  }
  // ================= QUERY =================
  async getPublicStories(
    paginationParams: PaginationParams,
    filter?: StoryFilterDto,
  ): Promise<PaginatedResponse<Story>> {
    return this.queryService.getPublicStories(paginationParams, filter);
  }

  async getAdminStories(
    paginationParams: PaginationParams,
    filter?: StoryFilterDto,
  ): Promise<PaginatedResponse<Story>> {
    return this.queryService.getAdminStories(paginationParams, filter);
  }

  async getStoryById(storyId: string): Promise<Story> {
    return this.queryService.getStoryById(storyId);
  }

  async getFeaturedStories(limit?: number): Promise<Story[]> {
    return this.queryService.getFeaturedStories(limit);
  }

  async getStoriesByProgram(
    programId: string,
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<Story>> {
    return this.queryService.getStoriesByProgram(programId, paginationParams);
  }

  async searchStories(
    searchTerm: string,
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<Story>> {
    return this.queryService.searchStories(searchTerm, paginationParams);
  }

  // ================= DELETION =================
  async deleteStory(storyId: string): Promise<void> {
    return this.deletionService.deleteStory(storyId);
  }

  async bulkDeleteStories(storyIds: string[]): Promise<number> {
    return this.deletionService.bulkDeleteStories(storyIds);
  }

  // ================= STATISTICS =================
  async getStoryWithStats(storyId: string): Promise<any> {
    return this.statsService.getStoryWithStats(storyId);
  }

  async getStoriesStats(): Promise<any> {
    return this.statsService.getStoriesStats();
  }

  // ================= VALIDATION =================
  async validateStory(storyId: string, relations?: string[]): Promise<Story> {
    return this.validationService.validateStory(storyId, relations);
  }
}