// src/modules/content/services/story-media.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from '../entities/story.entity';
import { CloudinaryService } from '../../../shared/services/cloudinary.service';
import { StoryValidationService } from './story-validation.service';

@Injectable()
export class StoryMediaService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly validationService: StoryValidationService,
  ) {}

  async addMedia(
    storyId: string,
    file: Express.Multer.File,
    mediaType: 'image' | 'video',
    caption?: string,
  ): Promise<Story> {
    // Validate story exists
    const story = await this.validationService.validateStory(storyId);
    
    // Validate file
    this.validationService.validateMediaFile(file, mediaType);

    // Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadStoryMedia(storyId, file, mediaType);

    // Generate thumbnail for videos
    let thumbnailUrl = uploadResult.url;
    if (mediaType === 'video') {
      thumbnailUrl = this.cloudinaryService.getDocumentPreviewUrl(uploadResult.publicId, {
        width: 500,
        format: 'jpg',
      });
    }

    // Initialize media array if not exists
    if (!story.media) {
      story.media = [];
    }

    // Add media to story
    story.media.push({
      url: uploadResult.url,
      type: mediaType,
      caption: caption || `${mediaType} for story ${story.title.en}`,
      thumbnail: thumbnailUrl,
    });

    return this.storyRepository.save(story);
  }

  async addMultipleMedia(
    storyId: string,
    files: Express.Multer.File[],
    mediaTypes: ('image' | 'video')[],
    captions: string[],
  ): Promise<Story> {
    const story = await this.validationService.validateStory(storyId);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mediaType = mediaTypes[i] || 'image';
      const caption = captions[i];

      await this.addMedia(storyId, file, mediaType, caption);
    }

    return this.validationService.validateStory(storyId, ['program']);
  }

  async removeMedia(storyId: string, mediaUrl: string): Promise<Story> {
    const story = await this.validationService.validateStory(storyId);

    if (!story.media || story.media.length === 0) {
      return story;
    }

    // Find media item
    const mediaItem = story.media.find(item => item.url === mediaUrl);
    
    if (mediaItem) {
      // Extract public ID from URL
      const publicId = this.cloudinaryService.extractPublicIdFromUrl(mediaItem.url);
      if (publicId) {
        await this.cloudinaryService.deleteFile(publicId);
      }

      // Remove from array
      story.media = story.media.filter(item => item.url !== mediaUrl);
    }

    return this.storyRepository.save(story);
  }

  async updateMediaCaption(
    storyId: string,
    mediaUrl: string,
    caption: string,
  ): Promise<Story> {
    const story = await this.validationService.validateStory(storyId);

    if (story.media) {
      const mediaItem = story.media.find(item => item.url === mediaUrl);
      if (mediaItem) {
        mediaItem.caption = caption;
      }
    }

    return this.storyRepository.save(story);
  }
}