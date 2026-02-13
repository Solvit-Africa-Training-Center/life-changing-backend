// src/modules/content/services/story-stats.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from '../entities/story.entity';
import { StoryValidationService } from './story-validation.service';
import { Language } from '../../../config/constants';

@Injectable()
export class StoryStatsService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    private readonly validationService: StoryValidationService,
  ) {}

  async getStoryWithStats(storyId: string): Promise<Story & {
    readingTimeMinutes: number;
    mediaCount: number;
    engagement: number;
  }> {
    const story = await this.validationService.validateStory(storyId, ['program', 'beneficiary']);

    const readingTimeMinutes = Math.ceil((story.metadata?.duration || 0) / 60);
    const mediaCount = story.media?.length || 0;
    const engagement = story.viewCount + story.shareCount * 2; // Simple engagement score

    return {
      ...story,
      readingTimeMinutes,
      mediaCount,
      engagement,
    };
  }

  async getStoriesStats(): Promise<any> {
    const totalStories = await this.storyRepository.count();
    const publishedStories = await this.storyRepository.count({
      where: { isPublished: true },
    });
    const featuredStories = await this.storyRepository.count({
      where: { isFeatured: true },
    });
    const draftStories = await this.storyRepository.count({
      where: { isPublished: false },
    });
    
    const totalViews = await this.storyRepository
      .createQueryBuilder('story')
      .select('SUM(story.viewCount)', 'total')
      .getRawOne();

    const totalShares = await this.storyRepository
      .createQueryBuilder('story')
      .select('SUM(story.shareCount)', 'total')
      .getRawOne();

    const storiesByLanguage = await this.storyRepository
      .createQueryBuilder('story')
      .select('story.language, COUNT(*) as count')
      .groupBy('story.language')
      .getRawMany();

    const storiesByProgram = await this.storyRepository
      .createQueryBuilder('story')
      .leftJoin('story.program', 'program')
      .select('program.id, program.name, COUNT(story.id) as count')
      .groupBy('program.id, program.name')
      .having('COUNT(story.id) > 0')
      .getRawMany();

    const storiesByMonth = await this.storyRepository
      .createQueryBuilder('story')
      .select("TO_CHAR(story.publishedDate, 'YYYY-MM') as month, COUNT(*) as count")
      .where('story.publishedDate IS NOT NULL')
      .groupBy("TO_CHAR(story.publishedDate, 'YYYY-MM')")
      .orderBy('month', 'DESC')
      .limit(12)
      .getRawMany();

    const topViewedStories = await this.storyRepository
      .createQueryBuilder('story')
      .select(['story.id', 'story.title', 'story.viewCount'])
      .where('story.isPublished = true')
      .orderBy('story.viewCount', 'DESC')
      .limit(5)
      .getRawMany();

    const topSharedStories = await this.storyRepository
      .createQueryBuilder('story')
      .select(['story.id', 'story.title', 'story.shareCount'])
      .where('story.isPublished = true')
      .orderBy('story.shareCount', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      overview: {
        total: totalStories,
        published: publishedStories,
        featured: featuredStories,
        draft: draftStories,
        publicationRate: totalStories > 0 ? Math.round((publishedStories / totalStories) * 100) : 0,
      },
      engagement: {
        totalViews: parseInt(totalViews?.total || '0'),
        totalShares: parseInt(totalShares?.total || '0'),
        averageViewsPerStory: totalStories > 0 ? Math.round(parseInt(totalViews?.total || '0') / totalStories) : 0,
        averageSharesPerStory: totalStories > 0 ? Math.round(parseInt(totalShares?.total || '0') / totalStories) : 0,
      },
      byLanguage: storiesByLanguage,
      byProgram: storiesByProgram,
      byMonth: storiesByMonth,
      topStories: {
        mostViewed: topViewedStories,
        mostShared: topSharedStories,
      },
    };
  }

  async getProgramStoryStats(programId: string): Promise<any> {
    await this.validationService.validateProgram(programId);

    const stats = await this.storyRepository
      .createQueryBuilder('story')
      .where('story.program_id = :programId', { programId })
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN story.isPublished THEN 1 ELSE 0 END) as published',
        'SUM(CASE WHEN story.isFeatured THEN 1 ELSE 0 END) as featured',
        'SUM(story.viewCount) as totalViews',
        'SUM(story.shareCount) as totalShares',
        'AVG(story.viewCount) as averageViews',
      ])
      .getRawOne();

    return {
      programId,
      ...stats,
    };
  }

  async getBeneficiaryStoryStats(beneficiaryId: string): Promise<any> {
    await this.validationService.validateBeneficiary(beneficiaryId);

    const stats = await this.storyRepository
      .createQueryBuilder('story')
      .where('story.beneficiary_id = :beneficiaryId', { beneficiaryId })
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN story.isPublished THEN 1 ELSE 0 END) as published',
        'SUM(story.viewCount) as totalViews',
        'SUM(story.shareCount) as totalShares',
      ])
      .getRawOne();

    return {
      beneficiaryId,
      ...stats,
    };
  }

  async getAuthorStats(authorName: string): Promise<any> {
    const stats = await this.storyRepository
      .createQueryBuilder('story')
      .where('story.authorName = :authorName', { authorName })
      .andWhere('story.isPublished = true')
      .select([
        'COUNT(*) as totalStories',
        'SUM(story.viewCount) as totalViews',
        'SUM(story.shareCount) as totalShares',
        'AVG(story.viewCount) as averageViews',
      ])
      .getRawOne();

    const recentStories = await this.storyRepository.find({
      where: { authorName, isPublished: true },
      order: { publishedDate: 'DESC' },
      take: 3,
    });

    return {
      authorName,
      ...stats,
      recentStories,
    };
  }
}