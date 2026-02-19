// src/modules/content/services/story-media.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
  ) { }

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
    let thumbnailPublicId: string | undefined = undefined;

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

    // Add media to story WITH publicId
    story.media.push({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      type: mediaType,
      caption: caption || `${mediaType} for story ${story.title?.en || storyId}`,
      thumbnail: thumbnailUrl,
      thumbnailPublicId: thumbnailPublicId,
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

    // Ensure arrays have correct length
    const validMediaTypes = mediaTypes.slice(0, files.length);
    const validCaptions = captions.slice(0, files.length);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mediaType = validMediaTypes[i] || (file.mimetype.startsWith('video/') ? 'video' : 'image');
      const caption = validCaptions[i] || '';

      await this.addMedia(storyId, file, mediaType, caption);
    }

    return this.validationService.validateStory(storyId, ['program', 'beneficiary']);
  }

  async removeMedia(storyId: string, mediaPublicId: string): Promise<Story> {
    const story = await this.validationService.validateStory(storyId);

    if (!story.media || story.media.length === 0) {
      throw new NotFoundException('No media found for this story');
    }

    // Find media item by publicId
    const mediaItem = story.media.find(item => item.publicId === mediaPublicId);

    if (!mediaItem) {
      throw new NotFoundException(`Media with publicId ${mediaPublicId} not found`);
    }

    // Delete from Cloudinary
    if (mediaItem.publicId) {
      await this.cloudinaryService.deleteFile(mediaItem.publicId);
    }

    // Delete thumbnail if exists
    if (mediaItem.thumbnailPublicId) {
      await this.cloudinaryService.deleteFile(mediaItem.thumbnailPublicId);
    }

    // Remove from array
    story.media = story.media.filter(item => item.publicId !== mediaPublicId);

    return this.storyRepository.save(story);
  }

  async removeMultipleMedia(storyId: string, publicIds: string[]): Promise<Story> {
    const story = await this.validationService.validateStory(storyId);

    if (!story.media || story.media.length === 0) {
      throw new NotFoundException('No media found for this story');
    }

    // Delete each media file from Cloudinary
    for (const publicId of publicIds) {
      const mediaItem = story.media.find(item => item.publicId === publicId);
      if (mediaItem) {
        if (mediaItem.publicId) {
          await this.cloudinaryService.deleteFile(mediaItem.publicId);
        }
        if (mediaItem.thumbnailPublicId) {
          await this.cloudinaryService.deleteFile(mediaItem.thumbnailPublicId);
        }
      }
    }

    // Remove from array
    story.media = story.media.filter(item => !publicIds.includes(item.publicId));

    return this.storyRepository.save(story);
  }

  async removeMediaByUrl(storyId: string, mediaUrl: string): Promise<Story> {
    const story = await this.validationService.validateStory(storyId);

    if (!story.media || story.media.length === 0) {
      throw new NotFoundException('No media found for this story');
    }

    // Find media item by URL
    const mediaItem = story.media.find(item => item.url === mediaUrl);

    if (!mediaItem) {
      throw new NotFoundException(`Media with URL ${mediaUrl} not found`);
    }

    // Delete from Cloudinary using publicId
    if (mediaItem.publicId) {
      await this.cloudinaryService.deleteFile(mediaItem.publicId);
    }

    // Remove from array
    story.media = story.media.filter(item => item.url !== mediaUrl);

    return this.storyRepository.save(story);
  }

  async updateMediaCaption(
    storyId: string,
    mediaPublicId: string,
    caption: string,
  ): Promise<Story> {
    const story = await this.validationService.validateStory(storyId);

    if (story.media) {
      const mediaItem = story.media.find(item => item.publicId === mediaPublicId);
      if (mediaItem) {
        mediaItem.caption = caption;
      } else {
        throw new NotFoundException(`Media with publicId ${mediaPublicId} not found`);
      }
    }

    return this.storyRepository.save(story);
  }

  async updateMultipleMediaCaptions(
    storyId: string,
    updates: { publicId: string; caption: string }[],
  ): Promise<Story> {
    const story = await this.validationService.validateStory(storyId);

    if (story.media) {
      for (const update of updates) {
        const mediaItem = story.media.find(item => item.publicId === update.publicId);
        if (mediaItem) {
          mediaItem.caption = update.caption;
        }
      }
    }

    return this.storyRepository.save(story);
  }

  async deleteAllStoryMedia(storyId: string): Promise<void> {
    const story = await this.validationService.validateStory(storyId);

    if (story.media && story.media.length > 0) {
      // Delete all media files from Cloudinary
      const deletePromises = story.media.map(item =>
        this.cloudinaryService.deleteFile(item.publicId)
      );

      await Promise.all(deletePromises);
    }

    // Also delete the story folder
    await this.cloudinaryService.deleteFolder(`stories/${storyId}`);
  }
}