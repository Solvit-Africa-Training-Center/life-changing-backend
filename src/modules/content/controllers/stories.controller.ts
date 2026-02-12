// src/modules/content/controllers/stories.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserType } from '../../../config/constants';

import { StoriesService } from '../services/stories.service';
import { CreateStoryDTO } from '../dto/create-story.dto';
import { UpdateStoryDTO } from '../dto/update-story.dto';
import { StoryFilterDto } from '../dto/story-filter.dto';
import { AddMediaDto } from '../dto/add-media.dto';
import type { PaginationParams } from '../../../shared/interfaces/pagination.interface';

@ApiTags('stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  // ================= PUBLIC ENDPOINTS =================

  @Get()
  @ApiOperation({ summary: 'Get all published stories (public)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'rw'] })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
  @ApiQuery({ name: 'programId', required: false, type: String })
  @ApiQuery({ name: 'beneficiaryId', required: false, type: String })
  async getPublicStories(
    @Query() paginationParams: PaginationParams,
    @Query() filter: StoryFilterDto,
  ) {
    return this.storiesService.getPublicStories(paginationParams, filter);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured stories (public)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFeaturedStories(@Query('limit') limit?: number) {
    return this.storiesService.getFeaturedStories(limit);
  }

  @Get('program/:programId')
  @ApiOperation({ summary: 'Get stories by program (public)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getStoriesByProgram(
    @Param('programId') programId: string,
    @Query() paginationParams: PaginationParams,
  ) {
    return this.storiesService.getStoriesByProgram(programId, paginationParams);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search stories (public)' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchStories(
    @Query('q') searchTerm: string,
    @Query() paginationParams: PaginationParams,
  ) {
    if (!searchTerm || searchTerm.trim() === '') {
      throw new BadRequestException('Search term is required');
    }
    return this.storiesService.searchStories(searchTerm, paginationParams);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get story by ID (public)' })
  async getStory(@Param('id') id: string) {
    const story = await this.storiesService.getStoryById(id);
    
    // Increment view count asynchronously
    this.storiesService.incrementViewCount(id).catch(console.error);
    
    return this.storiesService.getStoryWithStats(id);
  }

  // ================= ADMIN ENDPOINTS =================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('media', 10, {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max per file
      fileFilter: (req, file, cb) => {
        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');

        if (!isImage && !isVideo) {
          return cb(
            new BadRequestException('Only image and video files are allowed'),
            false,
          );
        }

        if (isImage) {
          const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
          if (!allowedMimes.includes(file.mimetype)) {
            return cb(
              new BadRequestException(
                `Image type ${file.mimetype} not allowed. Allowed types: JPEG, PNG, WebP, GIF`
              ),
              false,
            );
          }
          if (file.size > 10 * 1024 * 1024) {
            return cb(
              new BadRequestException('Image size must not exceed 10MB'),
              false,
            );
          }
        }

        if (isVideo) {
          const allowedMimes = ['video/mp4', 'video/quicktime', 'video/webm'];
          if (!allowedMimes.includes(file.mimetype)) {
            return cb(
              new BadRequestException(
                `Video type ${file.mimetype} not allowed. Allowed types: MP4, MOV, WebM`
              ),
              false,
            );
          }
          if (file.size > 100 * 1024 * 1024) {
            return cb(
              new BadRequestException('Video size must not exceed 100MB'),
              false,
            );
          }
        }

        cb(null, true);
      },
    }),
  )
  @ApiBody({
    description: 'Create a new story with optional media files',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          example: '{"en":"How Women Entrepreneurship Changed My Life","rw":"Uburyo Ubucuruzi bwAbagore bwahinduye ubuzima bwanjye"}',
        },
        content: {
          type: 'string',
          example: '{"en":"Marie started her business with just 50,000 RWF...","rw":"Marie yatangiye ubucuruzi bwe afite 50,000 RWF gusa..."}',
        },
        authorName: { type: 'string', example: 'Marie Uwase' },
        authorRole: { type: 'string', enum: Object.values(UserType), example: 'beneficiary' },
        programId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        beneficiaryId: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        publishedDate: { type: 'string', format: 'date', example: '2026-03-15' },
        language: { type: 'string', enum: ['en', 'rw'], example: 'en' },
        isFeatured: { type: 'boolean', example: false },
        isPublished: { type: 'boolean', example: true },
        metadata: {
          type: 'string',
          example: '{"tags":["women-empowerment","entrepreneurship"],"location":"Kigali","duration":120}',
        },
        media: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Media files (images/videos)',
        },
        mediaTypes: {
          type: 'string',
          example: '["image","video"]',
          description: 'JSON string array of media types',
        },
        captions: {
          type: 'string',
          example: '["Marie receiving her certificate","Marie at her business"]',
          description: 'JSON string array of captions',
        },
      },
      required: ['title', 'content', 'authorName', 'authorRole'],
    },
  })
  async createStory(
    @Body() data: CreateStoryDTO,
    @UploadedFiles() files?: Express.Multer.File[],
    @Body('mediaTypes') mediaTypesStr?: string,
    @Body('captions') captionsStr?: string,
  ) {
    // Parse media types and captions from JSON strings
    let mediaTypes: ('image' | 'video')[] = [];
    let captions: string[] = [];

    if (mediaTypesStr) {
      try {
        mediaTypes = JSON.parse(mediaTypesStr);
      } catch {
        throw new BadRequestException('Invalid mediaTypes format. Must be a JSON array.');
      }
    }

    if (captionsStr) {
      try {
        captions = JSON.parse(captionsStr);
      } catch {
        throw new BadRequestException('Invalid captions format. Must be a JSON array.');
      }
    }

    // Ensure mediaTypes length matches files length
    if (files && files.length > 0) {
      if (mediaTypes.length !== files.length) {
        throw new BadRequestException(
          'Number of media types must match number of files',
        );
      }
    }

    return this.storiesService.createStoryWithMedia(data, files, mediaTypes, captions);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a story (admin only)' })
  async updateStory(
    @Param('id') id: string,
    @Body() data: UpdateStoryDTO,
  ) {
    return this.storiesService.updateStory(id, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a story (admin only)' })
  async deleteStory(@Param('id') id: string) {
    await this.storiesService.deleteStory(id);
  }

  @Post(':id/media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: { fileSize: 100 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');

        if (!isImage && !isVideo) {
          return cb(
            new BadRequestException('Only image and video files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Add media to a story (admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        mediaTypes: {
          type: 'string',
          example: '["image","video"]',
        },
        captions: {
          type: 'string',
          example: '["Caption 1","Caption 2"]',
        },
      },
    },
  })
  async addMedia(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('mediaTypes') mediaTypesStr?: string,
    @Body('captions') captionsStr?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    let mediaTypes: ('image' | 'video')[] = [];
    let captions: string[] = [];

    if (mediaTypesStr) {
      try {
        mediaTypes = JSON.parse(mediaTypesStr);
      } catch {
        throw new BadRequestException('Invalid mediaTypes format');
      }
    }

    if (captionsStr) {
      try {
        captions = JSON.parse(captionsStr);
      } catch {
        throw new BadRequestException('Invalid captions format');
      }
    }

    // If mediaTypes not provided, try to detect from file mime type
    if (mediaTypes.length === 0) {
      mediaTypes = files.map(file =>
        file.mimetype.startsWith('video/') ? 'video' : 'image'
      );
    }

    // Ensure captions array length matches files
    while (captions.length < files.length) {
      captions.push('');
    }

    return this.storiesService.addMultipleMedia(id, files, mediaTypes, captions);
  }

  @Delete(':id/media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove media from a story (admin only)' })
  async removeMedia(
    @Param('id') id: string,
    @Body('mediaUrl') mediaUrl: string,
  ) {
    if (!mediaUrl) {
      throw new BadRequestException('mediaUrl is required');
    }
    return this.storiesService.removeMedia(id, mediaUrl);
  }

  @Patch(':id/media/caption')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update media caption (admin only)' })
  async updateMediaCaption(
    @Param('id') id: string,
    @Body('mediaUrl') mediaUrl: string,
    @Body('caption') caption: string,
  ) {
    if (!mediaUrl) throw new BadRequestException('mediaUrl is required');
    if (!caption) throw new BadRequestException('caption is required');
    
    return this.storiesService.updateMediaCaption(id, mediaUrl, caption);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Increment share count (public)' })
  async incrementShareCount(@Param('id') id: string) {
    await this.storiesService.incrementShareCount(id);
    return { message: 'Share count updated successfully' };
  }

  // ================= ADMIN STATS ENDPOINTS =================

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all stories with filters (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'rw'] })
  @ApiQuery({ name: 'programId', required: false, type: String })
  async getAdminStories(
    @Query() paginationParams: PaginationParams,
    @Query() filter: StoryFilterDto,
  ) {
    return this.storiesService.getAdminStories(paginationParams, filter);
  }

  @Get('stats/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get stories statistics (admin only)' })
  async getStoriesStats() {
    return this.storiesService.getStoriesStats();
  }
}