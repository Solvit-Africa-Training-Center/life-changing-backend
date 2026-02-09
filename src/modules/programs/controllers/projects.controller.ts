// // src/modules/programs/controllers/projects.controller.ts
// import {
//   Controller,
//   Get,
//   Post,
//   Patch,
//   Delete,
//   Param,
//   Body,
//   Query,
//   UploadedFile,
//   UseInterceptors,
//   UseGuards,
// } from '@nestjs/common';
// import { ApiTags, ApiConsumes, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
// import { RolesGuard } from '../../../common/guards/roles.guard';
// import { Roles } from '../../../common/decorators/roles.decorator';
// import { UserType } from '../../../config/constants';

// import { ProjectsService } from '../services/projects.service';

// @ApiTags('projects')
// @Controller('projects')
// export class ProjectsController {
//   constructor(private readonly projectsService: ProjectsService) {}

//   @Get()
//   @ApiOperation({ summary: 'Get projects by program ID (public)' })
//   @ApiQuery({ name: 'programId', required: true })
//   @ApiQuery({ name: 'isActive', required: false, type: Boolean })
//   @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
//   async getProjectsByProgram(
//     @Query('programId') programId: string,
//     @Query('isActive') isActive?: boolean,
//     @Query('isFeatured') isFeatured?: boolean,
//   ) {
//     return this.projectsService.getProjectsByProgram(programId, {
//       isActive: isActive !== undefined ? Boolean(isActive) : undefined,
//       isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
//     });
//   }

//   @Get(':projectId')
//   @ApiOperation({ summary: 'Get project details (public)' })
//   async getProject(@Param('projectId') projectId: string) {
//     return this.projectsService.getProjectDetails(projectId);
//   }

//   @Post(':programId/:projectId/cover')
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(UserType.ADMIN)
//   @ApiBearerAuth()
//   @ApiConsumes('multipart/form-data')
//   @UseInterceptors(FileInterceptor('file'))
//   @ApiOperation({ summary: 'Upload project cover image (admin only)' })
//   async uploadProjectCover(
//     @Param('programId') programId: string,
//     @Param('projectId') projectId: string,
//     @UploadedFile() file: Express.Multer.File,
//   ) {
//     return this.projectsService.uploadProjectCover(programId, projectId, file);
//   }

//   @Post(':programId/:projectId/gallery')
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(UserType.ADMIN)
//   @ApiBearerAuth()
//   @ApiConsumes('multipart/form-data')
//   @UseInterceptors(FileInterceptor('file'))
//   @ApiOperation({ summary: 'Upload image to project gallery (admin only)' })
//   async uploadToGallery(
//     @Param('programId') programId: string,
//     @Param('projectId') projectId: string,
//     @UploadedFile() file: Express.Multer.File,
//     @Body() body: { caption?: string },
//   ) {
//     return this.projectsService.uploadToGallery(programId, projectId, file, body.caption);
//   }

//   @Delete(':programId/:projectId/gallery/:publicId')
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(UserType.ADMIN)
//   @ApiBearerAuth()
//   @ApiOperation({ summary: 'Delete image from project gallery (admin only)' })
//   async deleteGalleryItem(
//     @Param('programId') programId: string,
//     @Param('projectId') projectId: string,
//     @Param('publicId') publicId: string,
//   ) {
//     return this.projectsService.deleteGalleryItem(programId, projectId, publicId);
//   }

//   @Patch(':projectId/allocation')
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(UserType.ADMIN)
//   @ApiBearerAuth()
//   @ApiOperation({ summary: 'Update donation allocation percentage (admin only)' })
//   async updateDonationAllocation(
//     @Param('projectId') projectId: string,
//     @Body() body: { percentage: number },
//   ) {
//     return this.projectsService.updateDonationAllocation(projectId, body.percentage);
//   }

//   @Patch(':projectId/budget')
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(UserType.ADMIN)
//   @ApiBearerAuth()
//   @ApiOperation({ summary: 'Update project budget (admin only)' })
//   async updateProjectBudget(
//     @Param('projectId') projectId: string,
//     @Body() body: {
//       budgetRequired?: number;
//       budgetReceived?: number;
//       budgetUtilized?: number;
//     },
//   ) {
//     return this.projectsService.updateProjectBudget(projectId, body);
//   }
// }

// src/modules/programs/controllers/projects.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiConsumes,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserType } from '../../../config/constants';

import { ProjectsService } from '../services/projects.service';
import { Project } from '../entities/project.entity';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  // ================= PUBLIC ENDPOINTS =================

  @Get()
  @ApiOperation({ summary: 'Get projects by program ID (public)' })
  @ApiQuery({ name: 'programId', required: true, description: 'Program ID' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean, description: 'Filter by featured status' })
  async getProjectsByProgram(
    @Query('programId') programId: string,
    @Query('isActive') isActive?: boolean,
    @Query('isFeatured') isFeatured?: boolean,
  ) {
    return this.projectsService.getProjectsByProgram(programId, {
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
    });
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get project details (public)' })
  async getProject(@Param('projectId') projectId: string) {
    return this.projectsService.getProjectDetails(projectId);
  }

  // ================= ADMIN ENDPOINTS =================

  @Post(':programId/:projectId/cover')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
      const isImage = file.mimetype.startsWith('image/');

      if (!isImage) {
        return cb(
          new BadRequestException('Only image files are allowed for cover images'),
          false,
        );
      }

      // Specific image type validation
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(
          new BadRequestException(
            `Image type ${file.mimetype} not allowed. Allowed types: JPEG, PNG, WebP`
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

      cb(null, true);
    },
  }))
  @ApiOperation({ summary: 'Upload project cover image (admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Project cover image (max 10MB, JPEG/PNG/WebP)'
        },
      },
    },
  })
  async uploadProjectCover(
    @Param('programId') programId: string,
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.projectsService.uploadProjectCover(programId, projectId, file);
  }

  @Post(':programId/:projectId/gallery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB per file
    },
    fileFilter: (req, file, cb) => {
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');

      if (!isImage && !isVideo) {
        return cb(
          new BadRequestException('Only image and video files are allowed'),
          false,
        );
      }

      // Image specific validation
      if (isImage) {
        const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedImageMimes.includes(file.mimetype)) {
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

      // Video specific validation
      if (isVideo) {
        const allowedVideoMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
        if (!allowedVideoMimes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              `Video type ${file.mimetype} not allowed. Allowed types: MP4, MOV, AVI, WMV`
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
  }))
  @ApiOperation({ summary: 'Upload multiple files to project gallery (admin only)' })
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
          description: 'Multiple files for project gallery (max 10 files, 10MB images, 100MB videos)'
        },
        caption: {
          type: 'string',
          description: 'Optional caption for all uploaded files',
        },
      },
    },
  })
  async uploadToGallery(
    @Param('programId') programId: string,
    @Param('projectId') projectId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { caption?: string },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    // Process multiple files
    const results: any[] = []; // Use any[] to avoid type issues
    for (const file of files) {
      const result = await this.projectsService.uploadToGallery(programId, projectId, file, body.caption);
      results.push(result);
    }
    return {
      message: `Successfully uploaded ${files.length} file(s)`,
      files: results.map(r => ({
        url: r.coverImage,
        galleryCount: r.gallery?.length || 0,
      })),
      project: results[results.length - 1],
    };
  }

  @Delete(':programId/:projectId/gallery/:publicId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete image from project gallery (admin only)' })
  async deleteGalleryItem(
    @Param('programId') programId: string,
    @Param('projectId') projectId: string,
    @Param('publicId') publicId: string,
  ) {
    return this.projectsService.deleteGalleryItem(programId, projectId, publicId);
  }

  @Patch(':projectId/allocation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update donation allocation percentage (admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        percentage: {
          type: 'number',
          example: 80,
          minimum: 0,
          maximum: 100,
          description: 'Allocation percentage (0-100)'
        },
      },
      required: ['percentage']
    },
  })
  async updateDonationAllocation(
    @Param('projectId') projectId: string,
    @Body() body: { percentage: number },
  ) {
    return this.projectsService.updateDonationAllocation(projectId, body.percentage);
  }

  @Patch(':projectId/budget')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update project budget (admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        budgetRequired: {
          type: 'number',
          example: 15000000,
          description: 'Required budget amount',
        },
        budgetReceived: {
          type: 'number',
          example: 5000000,
          description: 'Received budget amount',
        },
        budgetUtilized: {
          type: 'number',
          example: 3000000,
          description: 'Utilized budget amount',
        },
      },
      minProperties: 1
    },
  })
  async updateProjectBudget(
    @Param('projectId') projectId: string,
    @Body() body: {
      budgetRequired?: number;
      budgetReceived?: number;
      budgetUtilized?: number;
    },
  ) {
    return this.projectsService.updateProjectBudget(projectId, body);
  }
}