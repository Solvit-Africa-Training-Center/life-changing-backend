// src/modules/content/services/story-query.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, Between, In } from 'typeorm';
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
      if (filter.beneficiaryId) where.beneficiary = { id: filter.beneficiaryId } as any;

      // Date range filter
      if (filter.fromDate && filter.toDate) {
        where.publishedDate = Between(
          new Date(filter.fromDate),
          new Date(filter.toDate)
        ) as any;
      } else if (filter.fromDate) {
        where.publishedDate = Between(
          new Date(filter.fromDate),
          new Date()
        ) as any;
      } else if (filter.toDate) {
        const whereAny = where as any;
        whereAny.publishedDate = Between(
          new Date('1970-01-01'),
          new Date(filter.toDate)
        );
      }

      if (filter.authorName) {
        where.authorName = Like(`%${filter.authorName}%`);
      }
    }

    const params = {
      ...paginationParams,
      sortBy: paginationParams.sortBy || 'publishedDate',
      sortOrder: paginationParams.sortOrder || 'DESC',
    };

    return this.paginate(params, where, ['program', 'beneficiary']);
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
      if (filter.beneficiaryId) where.beneficiary = { id: filter.beneficiaryId } as any;

      // Date range filter
      if (filter.fromDate && filter.toDate) {
        where.publishedDate = Between(
          new Date(filter.fromDate),
          new Date(filter.toDate)
        ) as any;
      } else if (filter.fromDate) {
        where.publishedDate = Between(
          new Date(filter.fromDate),
          new Date()
        ) as any;
      } else if (filter.toDate) {
        const whereAny = where as any;
        whereAny.publishedDate = Between(
          new Date('1970-01-01'),
          new Date(filter.toDate)
        );
      }

      if (filter.authorName) {
        where.authorName = Like(`%${filter.authorName}%`);
      }
    }

    const params = {
      ...paginationParams,
      sortBy: paginationParams.sortBy || 'createdAt',
      sortOrder: paginationParams.sortOrder || 'DESC',
    };

    return this.paginate(params, where, ['program', 'beneficiary']);
  }

  async getStoryById(storyId: string): Promise<Story> {
    return this.validationService.validateStory(storyId, ['program', 'beneficiary']);
  }

  async getFeaturedStories(limit: number = 6): Promise<Story[]> {
    return this.storyRepository.find({
      where: {
        isPublished: true,
        isFeatured: true,
      },
      relations: ['program', 'beneficiary'],
      order: { publishedDate: 'DESC' },
      take: Math.min(limit, 20),
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

    const params = {
      ...paginationParams,
      sortBy: paginationParams.sortBy || 'publishedDate',
      sortOrder: paginationParams.sortOrder || 'DESC',
    };

    return this.paginate(params, where, ['program', 'beneficiary']);
  }

  async getStoriesByBeneficiary(
    beneficiaryId: string,
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<Story>> {
    await this.validationService.validateBeneficiary(beneficiaryId);

    const where: FindOptionsWhere<Story> = {
      beneficiary: { id: beneficiaryId },
      isPublished: true,
    };

    const params = {
      ...paginationParams,
      sortBy: paginationParams.sortBy || 'publishedDate',
      sortOrder: paginationParams.sortOrder || 'DESC',
    };

    return this.paginate(params, where, ['program', 'beneficiary']);
  }

  async searchStories(
    searchTerm: string,
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<Story>> {
    if (!searchTerm || searchTerm.trim() === '') {
      return this.getPublicStories(paginationParams);
    }

    const searchLower = `%${searchTerm.toLowerCase()}%`;

    const where: FindOptionsWhere<Story>[] = [
      // Search in English title
      {
        title: { en: Like(searchLower) } as any,
        isPublished: true
      },
      // Search in Kinyarwanda title
      {
        title: { rw: Like(searchLower) } as any,
        isPublished: true
      },
      // Search in English content
      {
        content: { en: Like(searchLower) } as any,
        isPublished: true
      },
      // Search in Kinyarwanda content
      {
        content: { rw: Like(searchLower) } as any,
        isPublished: true
      },
      // Search in author name
      {
        authorName: Like(searchLower),
        isPublished: true
      },
    ];

    const params = {
      ...paginationParams,
      sortBy: paginationParams.sortBy || 'publishedDate',
      sortOrder: paginationParams.sortOrder || 'DESC',
    };

    return this.paginate(params, where, ['program', 'beneficiary']);
  }

  async getRecentStories(limit: number = 5): Promise<Story[]> {
    return this.storyRepository.find({
      where: { isPublished: true },
      relations: ['program', 'beneficiary'],
      order: { publishedDate: 'DESC' },
      take: Math.min(limit, 10),
    });
  }

  async getStoriesByDateRange(
    startDate: Date,
    endDate: Date,
    paginationParams: PaginationParams,
  ): Promise<PaginatedResponse<Story>> {
    const where: FindOptionsWhere<Story> = {
      publishedDate: Between(startDate, endDate) as any,
      isPublished: true,
    };

    const params = {
      ...paginationParams,
      sortBy: paginationParams.sortBy || 'publishedDate',
      sortOrder: paginationParams.sortOrder || 'DESC',
    };

    return this.paginate(params, where, ['program', 'beneficiary']);
  }

  async getStoryWithDetails(storyId: string): Promise<Story & { readingTimeMinutes: number; mediaCount: number }> {
    const story = await this.getStoryById(storyId);

    const readingTimeMinutes = Math.ceil((story.metadata?.duration || 0) / 60);
    const mediaCount = story.media?.length || 0;

    return {
      ...story,
      readingTimeMinutes,
      mediaCount,
    };
  }

  async getStoriesByIds(storyIds: string[]): Promise<Story[]> {
    return this.storyRepository.find({
      where: { id: In(storyIds) },
      relations: ['program', 'beneficiary'],
    });
  }
}