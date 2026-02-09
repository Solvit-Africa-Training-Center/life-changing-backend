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
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserType } from '../../../config/constants';

import { ProjectsService } from '../services/projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get projects by program ID (public)' })
  @ApiQuery({ name: 'programId', required: true })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
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

  @Post(':programId/:projectId/cover')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload project cover image (admin only)' })
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
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload image to project gallery (admin only)' })
  async uploadToGallery(
    @Param('programId') programId: string,
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { caption?: string },
  ) {
    return this.projectsService.uploadToGallery(programId, projectId, file, body.caption);
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