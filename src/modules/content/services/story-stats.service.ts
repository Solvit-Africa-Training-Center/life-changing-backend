// src/modules/content/services/story-stats.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from '../entities/story.entity';
import { StoryValidationService } from './story-validation.service';

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
  }> {
    const story = await this.validationService.validateStory(storyId, ['program']);

    const readingTimeMinutes = Math.ceil((story.metadata?.duration || 0) / 60);
    const mediaCount = story.media?.length || 0;

    return {
      ...story,
      readingTimeMinutes,
      mediaCount,
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

    return {
      total: totalStories,
      published: publishedStories,
      featured: featuredStories,
      draft: totalStories - publishedStories,
      totalViews: parseInt(totalViews?.total || '0'),
      totalShares: parseInt(totalShares?.total || '0'),
      byLanguage: storiesByLanguage,
    };
  }
}