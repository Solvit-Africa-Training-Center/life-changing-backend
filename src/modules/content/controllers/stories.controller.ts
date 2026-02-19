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
  constructor(private readonly storiesService: StoriesService) { }

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
        programId: { type: 'string', example: 'aebae5ff-22e4-4309-924b-37cbabf8a9aa' },
        beneficiaryId: { type: 'string', example: '04e85336-4f3a-4065-98c4-3b1b69fb31b9' },
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
          example: '["image","video"] or image,video',
          description: 'JSON string array of media types OR comma-separated values',
        },
        captions: {
          type: 'string',
          example: '["Marie receiving her certificate","Marie at her business"] or Caption1,Caption2',
          description: 'JSON string array of captions OR comma-separated values',
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
    // Helper for robust parsing
    const parseMixedInput = (input: string | string[]): string[] => {
      if (!input) return [];

      let items: any[] = [];

      // If array (e.g. from multiple form fields), flatten it
      if (Array.isArray(input)) {
        items = input;
      } else {
        // Try JSON parse first
        try {
          const parsed = JSON.parse(input);
          items = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // Fallback to comma separation
          items = input.includes(',') ? input.split(',') : [input];
        }
      }

      // Flatten nested arrays and convert to string
      return items.flat().map(item => String(item).trim());
    };

    let mediaTypes: ('image' | 'video')[] = [];
    if (mediaTypesStr) {
      const p = parseMixedInput(mediaTypesStr);
      mediaTypes = p.map(t => {
        // Clean up common artifacts (quotes, brackets) from bad parsing
        const clean = t.replace(/['"\[\]]/g, '').toLowerCase();
        return clean.startsWith('vid') ? 'video' : 'image';
      });
    } else if (files && files.length > 0) {
      mediaTypes = files.map(file =>
        file.mimetype.startsWith('video/') ? 'video' : 'image'
      );
    }

    let captions: string[] = [];
    if (captionsStr) {
      const p = parseMixedInput(captionsStr);
      captions = p.map(c => {
        // Don't remove quotes from captions blindly, but handle the ["caption"] string case if needed
        // If the string starts with [ and ends with ], and parsing failed before, chance is it's a malformed array string
        // But complex captions might include []
        // For now, simple trim is safest, we rely on parseMixedInput for JSON structure
        if (c.startsWith('["') && c.endsWith('"]')) {
          try { return JSON.parse(c)[0]; } catch { return c; }
        }
        return c;
      });
    } else if (files && files.length > 0) {
      captions = files.map(() => '');
    }

    // Ensure arrays match
    if (files && files.length > 0) {
      const diff = files.length - mediaTypes.length;
      if (diff > 0) {
        const defaults = files.slice(mediaTypes.length).map(f => f.mimetype.startsWith('video/') ? 'video' : 'image');
        mediaTypes.push(...(defaults as ('image' | 'video')[]));
      }

      while (captions.length < files.length) {
        captions.push('');
      }

      // Trim if too many
      if (mediaTypes.length > files.length) mediaTypes = mediaTypes.slice(0, files.length);
      if (captions.length > files.length) captions = captions.slice(0, files.length);
    }

    return this.storiesService.createStoryWithMedia(data, files, mediaTypes, captions);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('media', 10, {
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
  @ApiOperation({ summary: 'Update a story with optional media files (admin only)' })
  @ApiBody({
    description: 'Update a story with optional media files',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          example: '{"en":"Updated Story Title","rw":"Umutwe w Inkuru Wahinduwe"}',
        },
        content: {
          type: 'string',
          example: '{"en":"Updated content...","rw":"Ibirimo byahinduwe..."}',
        },
        authorName: { type: 'string', example: 'Marie Uwase' },
        authorRole: { type: 'string', enum: Object.values(UserType), example: 'beneficiary' },
        programId: { type: 'string', example: 'aebae5ff-22e4-4309-924b-37cbabf8a9aa' },
        beneficiaryId: { type: 'string', example: '04e85336-4f3a-4065-98c4-3b1b69fb31b9' },
        publishedDate: { type: 'string', format: 'date', example: '2026-03-15' },
        language: { type: 'string', enum: ['en', 'rw'], example: 'en' },
        isFeatured: { type: 'boolean', example: false },
        isPublished: { type: 'boolean', example: true },
        metadata: {
          type: 'string',
          example: '{"tags":["women-empowerment","entrepreneurship"],"location":"Kigali","duration":120}',
        },
        // Media fields
        media: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'New media files to add (images/videos)',
        },
        mediaTypes: {
          type: 'string',
          example: '["image","video"] or image,video',
          description: 'Media types for new files - JSON array or comma-separated values',
        },
        captions: {
          type: 'string',
          example: '["New caption 1","New caption 2"] or Caption1,Caption2',
          description: 'Captions for new files - JSON array or comma-separated values',
        },
        // Media management fields
        updateMedia: {
          type: 'string',
          example: '[{"publicId":"abc123","caption":"Updated caption 1"},{"publicId":"def456","caption":"Updated caption 2"}]',
          description: 'JSON string array of media items to update captions',
        },
        removeMedia: {
          type: 'string',
          example: '["publicId1","publicId2"] or publicId1,publicId2',
          description: 'JSON array or comma-separated list of publicIds to remove',
        },
      },
    },
  })
  async updateStory(
    @Param('id') id: string,
    @Body() data: UpdateStoryDTO,
    @UploadedFiles() files?: Express.Multer.File[],
    @Body('mediaTypes') mediaTypesStr?: string,
    @Body('captions') captionsStr?: string,
    @Body('updateMedia') updateMediaStr?: string,
    @Body('removeMedia') removeMediaStr?: string,
  ) {
    // Helper for robust parsing (duplicated for scope access, or could be method)
    const parseMixedInput = (input: string | string[]): string[] => {
      if (!input) return [];
      let items: any[] = [];
      if (Array.isArray(input)) items = input;
      else {
        try {
          const parsed = JSON.parse(input);
          items = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          items = input.includes(',') ? input.split(',') : [input];
        }
      }
      return items.flat().map(item => String(item).trim());
    };

    // Parse media types for new files
    let mediaTypes: ('image' | 'video')[] = [];
    if (mediaTypesStr) {
      const p = parseMixedInput(mediaTypesStr);
      mediaTypes = p.map(t => {
        const clean = t.replace(/['"\[\]]/g, '').toLowerCase();
        return clean.startsWith('vid') ? 'video' : 'image';
      });
    } else if (files && files.length > 0) {
      mediaTypes = files.map(file =>
        file.mimetype.startsWith('video/') ? 'video' : 'image'
      );
    }

    // Parse captions for new files
    let captions: string[] = [];
    if (captionsStr) {
      const p = parseMixedInput(captionsStr);
      captions = p.map(c => {
        if (c.startsWith('["') && c.endsWith('"]')) {
          try { return JSON.parse(c)[0]; } catch { return c; }
        }
        return c;
      });
    } else if (files && files.length > 0) {
      captions = files.map(() => '');
    }

    // Parse media updates (caption updates)
    let mediaUpdates: { publicId: string; caption: string }[] = [];
    if (updateMediaStr) {
      try {
        const parsed = JSON.parse(updateMediaStr);
        mediaUpdates = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        throw new BadRequestException('Invalid updateMedia format. Must be a JSON array.');
      }
    }

    // Parse media to remove
    let mediaToRemove: string[] = [];
    if (removeMediaStr) {
      try {
        const parsed = JSON.parse(removeMediaStr);
        mediaToRemove = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        if (removeMediaStr.includes(',')) {
          mediaToRemove = removeMediaStr.split(',').map(c => c.trim());
        } else {
          mediaToRemove = [removeMediaStr.trim()];
        }
      }
    }

    // Ensure arrays match for new files
    if (files && files.length > 0) {
      const diff = files.length - mediaTypes.length;
      if (diff > 0) {
        const defaults = files.slice(mediaTypes.length).map(f => f.mimetype.startsWith('video/') ? 'video' : 'image');
        mediaTypes.push(...(defaults as ('image' | 'video')[]));
      }

      while (captions.length < files.length) {
        captions.push('');
      }

      if (mediaTypes.length > files.length) mediaTypes = mediaTypes.slice(0, files.length);
      if (captions.length > files.length) captions = captions.slice(0, files.length);
    }

    // Perform the update with all operations
    return this.storiesService.updateStoryWithMedia(
      id,
      data,
      files,
      mediaTypes,
      captions,
      mediaUpdates,
      mediaToRemove,
    );
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

    // Helper for robust parsing
    const parseMixedInput = (input: string | string[]): string[] => {
      if (!input) return [];
      let items: any[] = [];
      if (Array.isArray(input)) items = input;
      else {
        try {
          const parsed = JSON.parse(input);
          items = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          items = input.includes(',') ? input.split(',') : [input];
        }
      }
      return items.flat().map(item => String(item).trim());
    };

    let mediaTypes: ('image' | 'video')[] = [];
    let captions: string[] = [];

    if (mediaTypesStr) {
      const p = parseMixedInput(mediaTypesStr);
      mediaTypes = p.map(t => {
        const clean = t.replace(/['"\[\]]/g, '').toLowerCase();
        return clean.startsWith('vid') ? 'video' : 'image';
      });
    }

    if (captionsStr) {
      const p = parseMixedInput(captionsStr);
      captions = p.map(c => {
        if (c.startsWith('["') && c.endsWith('"]')) {
          try { return JSON.parse(c)[0]; } catch { return c; }
        }
        return c;
      });
    }

    // If mediaTypes not provided, try to detect from file mime type
    if (mediaTypes.length === 0 && files && files.length > 0) {
      mediaTypes = files.map(file =>
        file.mimetype.startsWith('video/') ? 'video' : 'image'
      );
    }

    // Ensure arrays match for new files
    if (files && files.length > 0) {
      const diff = files.length - mediaTypes.length;
      if (diff > 0) {
        const defaults = files.slice(mediaTypes.length).map(f => f.mimetype.startsWith('video/') ? 'video' : 'image');
        mediaTypes.push(...(defaults as ('image' | 'video')[]));
      }

      while (captions.length < files.length) {
        captions.push('');
      }

      if (mediaTypes.length > files.length) mediaTypes = mediaTypes.slice(0, files.length);
      if (captions.length > files.length) captions = captions.slice(0, files.length);
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