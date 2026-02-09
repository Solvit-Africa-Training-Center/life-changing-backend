import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from './entities/story.entity';
import { CloudinaryService } from 'src/shared/services/cloudinary.service';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  //  STORIES 

  async getPublishedStories(page = 1, limit = 10) {
    const [data, total] = await this.storyRepository.findAndCount({
      where: { isPublished: true },
      order: { publishedDate: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { data, meta: { page, limit, total } };
  }

  async getFeaturedStories(limit = 5) {
    return this.storyRepository.find({
      where: { isPublished: true, isFeatured: true },
      order: { publishedDate: 'DESC' },
      take: limit,
    });
  }

  async getStoryById(id: string) {
    const story = await this.storyRepository.findOne({ where: { id } });
    if (!story) throw new NotFoundException('Story not found');

    // Hide soft-deleted media from public response
    story.media = (story.media ?? []).filter(m => !m.isDeleted);

    return { message: 'Story fetched successfully', data: story };
  }

async createStory(payload: Partial<Story>) {
  const { media, isPublished, ...safePayload } = payload;

  const story = this.storyRepository.create({
    ...safePayload,
    media: [],
    isPublished: isPublished ?? false,
    publishedDate: isPublished ? new Date() : new Date(), 
  });

  const savedStory = await this.storyRepository.save(story);

  return {
    message: 'Story created successfully',
    data: savedStory,
  };
}



  async updatePublishStatus(id: string, isPublished: boolean) {
    const story = await this.storyRepository.findOne({ where: { id } });
    if (!story) throw new NotFoundException('Story not found');

    story.isPublished = isPublished;
    await this.storyRepository.save(story);

    return { message: 'Publish status updated', data: story };
  }

  async updateFeaturedStatus(id: string, isFeatured: boolean) {
    const story = await this.storyRepository.findOne({ where: { id } });
    if (!story) throw new NotFoundException('Story not found');

    story.isFeatured = isFeatured;
    await this.storyRepository.save(story);

    return { message: 'Featured status updated', data: story };
  }

  async deleteStory(id: string) {
    const result = await this.storyRepository.softDelete(id);
    if (!result.affected) throw new NotFoundException('Story not found');

    return { message: 'Story deleted successfully' };
  }

  // MEDIA UPLOAD & DELETE

  async uploadStoryMedia(storyId: string, files: Express.Multer.File[]) {
    const story = await this.storyRepository.findOne({ where: { id: storyId } });
    if (!story) throw new NotFoundException('Story not found');

    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    const activeMediaCount =
      (story.media ?? []).filter(m => !m.isDeleted).length;

    if (activeMediaCount + files.length > 5) {
      throw new BadRequestException(
        `This story already has ${activeMediaCount} media items. You can upload only ${
          5 - activeMediaCount
        } more.`,
      );
    }

  const uploadedMedia: NonNullable<Story['media']> = await Promise.all(
  files.map(async (file) => {
    const uploadResult = await this.cloudinaryService.uploadFile(
      file,
      `content/stories/${storyId}`,
    );

        return {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          type: uploadResult.resourceType === 'video' ? 'video' : 'image',
          thumbnail: uploadResult.url,
          isDeleted: false,
      
        };
      }),
    );

    story.media = [...(story.media ?? []), ...uploadedMedia];
    await this.storyRepository.save(story);

    return {
      message: 'Media uploaded successfully',
      mediaCount: story.media.filter(m => !m.isDeleted).length,
      data: uploadedMedia,
    };
  }

 // soft delete media

  async deleteStoryMedia(storyId: string, publicId: string) {
    const story = await this.storyRepository.findOne({ where: { id: storyId } });
    if (!story) throw new NotFoundException('Story not found');

    const media = story.media ?? [];
    const target = media.find(m => m.publicId === publicId && !m.isDeleted);

    if (!target) {
      throw new NotFoundException('Media not found');
    }

    target.isDeleted = true;
    target.deletedAt = new Date().toISOString();

    await this.storyRepository.save(story);

    return { message: 'Media soft-deleted successfully' };
  }
}
