// src/modules/content/services/story-creation.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from '../entities/story.entity';
import { CreateStoryDTO } from '../dto/create-story.dto';
import { StoryValidationService } from './story-validation.service';
import { StoryMediaService } from './story-media.service';
import { Language } from '../../../config/constants';

@Injectable()
export class StoryCreationService {
    constructor(
        @InjectRepository(Story)
        private readonly storyRepository: Repository<Story>,
        private readonly validationService: StoryValidationService,
        private readonly mediaService: StoryMediaService,
    ) { }

    async createStory(dto: CreateStoryDTO): Promise<Story> {
        // Validate program and beneficiary if provided
        const program = dto.programId ? await this.validationService.validateProgram(dto.programId) : null;
        const beneficiary = dto.beneficiaryId ? await this.validationService.validateBeneficiary(dto.beneficiaryId) : null;

        // Validate published date
        const publishedDate = dto.publishedDate ? new Date(dto.publishedDate) : new Date();
        this.validationService.validateStoryDates(publishedDate);

        // Create story entity
        const storyData: Partial<Story> = {
            title: dto.title,
            content: dto.content,
            authorName: dto.authorName,
            authorRole: dto.authorRole,
            program,
            beneficiary,
            isFeatured: dto.isFeatured || false,
            isPublished: dto.isPublished ?? true,
            publishedDate,
            language: dto.language || Language.EN,
            viewCount: 0,
            shareCount: 0,
            media: [],
            metadata: {
                tags: dto.metadata?.tags || [],
                location: dto.metadata?.location || '',
                duration: dto.metadata?.duration || 0,
            },
        };

        const story = this.storyRepository.create(storyData);
        return this.storyRepository.save(story);
    }

    async createStoryWithMedia(
        dto: CreateStoryDTO,
        mediaFiles?: Express.Multer.File[],
        mediaTypes?: ('image' | 'video')[],
        captions?: string[],
    ): Promise<Story> {
        // First create the story
        const story = await this.createStory(dto);

        // Upload media files if provided
        if (mediaFiles && mediaFiles.length > 0) {
            const validMediaTypes = mediaTypes || [];
            const validCaptions = captions || [];

            await this.mediaService.addMultipleMedia(
                story.id,
                mediaFiles,
                validMediaTypes,
                validCaptions,
            );
        }

        // Return updated story with relations
        return this.validationService.validateStory(story.id, ['program', 'beneficiary']);
    }
}