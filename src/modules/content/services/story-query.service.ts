// src/modules/content/services/story-query.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { Story } from '../entities/story.entity';
import { BaseService } from '../../../shared/services/base.service';
import { PaginationParams, PaginatedResponse } from '../../../shared/interfaces/pagination.interface';
import { StoryFilterDto } from '../dto/story-filter.dto';
import { StoryValidationService } from './story-validation.service';
import { Language } from '../../../config/constants';

@Injectable()
export class StoryQueryService extends BaseService<Story> {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    private readonly validationService: StoryValidationService,
  ) {
    super(storyRepository);
  }

  async getPublicStories(
    paginationParams: PaginationParams,
    filter?: StoryFilterDto,
  ): Promise<PaginatedResponse<Story>> {
    const where: FindOptionsWhere<Story> = {
      isPublished: true,
    };

    if (filter) {
      if (filter.language) where.language = filter.language;
      if (filter.isFeatured !== undefined) where.isFeatured = filter.isFeatured;
      if (filter.programId) where.program = { id: filter.programId } as any;
      if (filter.beneficiaryId) where.beneficiaryId = filter.beneficiaryId;
    }

    return this.paginate(paginationParams, where, ['program']);
  }

  async getAdminStories(
    paginationParams: PaginationParams,
    filter?: StoryFilterDto,
  ): Promise<PaginatedResponse<Story>> {
    const where: FindOptionsWhere<Story> = {};

    if (filter) {
      if (filter.language) where.language = filter.language;
      if (filter.isPublished !== undefined) where.isPublished = filter.isPublished;
      if (filter.isFeatured !== undefined) where.isFeatured = filter.isFeatured;
      if (filter.programId) where.program = { id: filter.programId } as any;
      if (filter.beneficiaryId) where.beneficiaryId = filter.beneficiaryId;
    }

    return this.paginate(paginationParams, where, ['program']);
  }

  async getStoryById(storyId: string): Promise<Story> {
    return this.validationService.validateStory(storyId, ['program']);
  }

  async getFeaturedStories(limit: number = 6): Promise<Story[]> {
    return this.storyRepository.find({
      where: {
        isPublished: true,
        isFeatured: true,
      },
      relations: ['program'],
      order: { publishedDate: 'DESC' },
      take: limit,
    });
  }

  async getStoriesByProgram(
    programId: string,
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<Story>> {
    await this.validationService.validateProgram(programId);

    const where: FindOptionsWhere<Story> = {
      program: { id: programId },
      isPublished: true,
    };

    return this.paginate(paginationParams, where, ['program']);
  }

  async searchStories(
    searchTerm: string,
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<Story>> {
    const where: FindOptionsWhere<Story>[] = [
      { title: { en: Like(`%${searchTerm}%`) } as any, isPublished: true },
      { title: { rw: Like(`%${searchTerm}%`) } as any, isPublished: true },
      { content: { en: Like(`%${searchTerm}%`) } as any, isPublished: true },
      { content: { rw: Like(`%${searchTerm}%`) } as any, isPublished: true },
      { authorName: Like(`%${searchTerm}%`), isPublished: true },
    ];

    return this.paginate(paginationParams, where, ['program']);
  }
}