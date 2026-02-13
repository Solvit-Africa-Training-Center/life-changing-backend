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

    // Delete all media from Cloudinary using publicIds
    await this.deleteAllStoryMedia(story);

    // Delete story from database
    await this.storyRepository.delete(storyId);
  }

  private async deleteAllStoryMedia(story: Story): Promise<void> {
    const deletePromises: Promise<void>[] = [];

    if (story.media && story.media.length > 0) {
      story.media.forEach(item => {
        // Delete main media file
        if (item.publicId) {
          deletePromises.push(this.cloudinaryService.deleteFile(item.publicId));
        }
        // Delete thumbnail if exists
        if (item.thumbnailPublicId) {
          deletePromises.push(this.cloudinaryService.deleteFile(item.thumbnailPublicId));
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