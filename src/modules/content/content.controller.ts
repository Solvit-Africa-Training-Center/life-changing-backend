import {Controller,Get,Post,Patch,Delete,Param,Body,Query,UseGuards,UseInterceptors,UploadedFiles,BadRequestException} from '@nestjs/common';
import { ContentService } from './content.service';
import { CreateStoryDto } from './dto/create-story.dto';
import {
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserType } from 'src/config/constants';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ================= PUBLIC =================

  @Get('stories')
  @ApiOperation({ summary: 'Get paginated published stories' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getStories(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.contentService.getPublishedStories(+page, +limit);
  }

  @Get('stories/featured')
  @ApiOperation({ summary: 'Get featured storiess' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getFeaturedStories(@Query('limit') limit = 5) {
    return this.contentService.getFeaturedStories(+limit);
  }

  @Get('stories/:id')
  @ApiOperation({ summary: 'Get a single story by ID' })
  getStoryById(@Param('id') id: string) {
    return this.contentService.getStoryById(id);
  }

  // ================= ADMIN =================

  @Post('stories')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Create a new story (Admin only)' })
  @ApiBody({ type: CreateStoryDto })
  createStory(@Body() dto: CreateStoryDto) {
    return this.contentService.createStory(dto);
  }

  @Patch('stories/:id/publish')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Publish or unpublish a story (Admin only)' })
  updatePublishStatus(
    @Param('id') id: string,
    @Body('isPublished') isPublished: boolean,
  ) {
    return this.contentService.updatePublishStatus(id, isPublished);
  }

  @Patch('stories/:id/feature')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Feature or unfeature a story (Admin only)' })
  updateFeaturedStatus(
    @Param('id') id: string,
    @Body('isFeatured') isFeatured: boolean,
  ) {
    return this.contentService.updateFeaturedStatus(id, isFeatured);
  }

  //  MEDIA 

@Post('stories/:id/media')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: {
        fileSize: 100 * 1024 * 1024, 
      },
      fileFilter: (req, file, cb) => {
        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');

        if (!isImage && !isVideo) {
          return cb(
            new BadRequestException(
              'Only image and video files are allowed',
            ),
            false,
          );
        }

        // Image max = 100MB
        if (isImage && file.size > 100 * 1024 * 1024) {
          return cb(
            new BadRequestException(
              'Image size must not exceed 50MB',
            ),
            false,
          );
        }

        cb(null, true);
      },
    }),
  )
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  uploadStoryMedia(
    @Param('id') storyId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.contentService.uploadStoryMedia(storyId, files);
  }

//admin must delete media by public id
  @Delete('stories/:id/media')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Remove media from a story (Admin only)' })
  @ApiQuery({
    name: 'publicId',
    required: true,
    description: 'Cloudinary publicId of the media',
  })
  removeStoryMedia(
    @Param('id') storyId: string,
    @Query('publicId') publicId: string,
  ) {
    return this.contentService.deleteStoryMedia(storyId, publicId);
  }
}
