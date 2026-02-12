// src/modules/content/services/story-deletion.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from '../entities/story.entity';
import { CloudinaryService } from '../../../shared/services/cloudinary.service';
import { StoryValidationService } from './story-validation.service';

@Injectable()
export class StoryDeletionService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly validationService: StoryValidationService,
  ) {}

  async deleteStory(storyId: string): Promise<void> {
    const story = await this.validationService.validateStory(storyId);

    // Delete all media from Cloudinary
    await this.deleteAllStoryMedia(story);

    // Delete story from database
    await this.storyRepository.delete(storyId);
  }

  async deleteAllStoryMedia(story: Story): Promise<void> {
    const deletePromises: Promise<void>[] = [];

    if (story.media && story.media.length > 0) {
      story.media.forEach(item => {
        const publicId = this.cloudinaryService.extractPublicIdFromUrl(item.url);
        if (publicId) {
          deletePromises.push(this.cloudinaryService.deleteFile(publicId));
        }
      });
    }

    // Also delete the story folder
    deletePromises.push(this.cloudinaryService.deleteFolder(`stories/${story.id}`));

    await Promise.all(deletePromises);
  }

  async bulkDeleteStories(storyIds: string[]): Promise<number> {
    let deletedCount = 0;

    for (const storyId of storyIds) {
      try {
        await this.deleteStory(storyId);
        deletedCount++;
      } catch (error) {
        // Log error and continue
        console.error(`Failed to delete story ${storyId}:`, error);
      }
    }

    return deletedCount;
  }
}