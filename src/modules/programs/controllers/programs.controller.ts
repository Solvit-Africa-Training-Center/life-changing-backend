// src/modules/programs/controllers/programs.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiBearerAuth, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ProgramStatus, UserType } from '../../../config/constants';

import { ProgramsService } from '../services/programs.service';
import { FilterProgramsDTO } from '../dto/filter-programs.dto';
import { CreateProgramDTO } from '../dto/create-program.dto';
import { UpdateProgramDTO } from '../dto/update-program.dto';
import { CreateProjectDTO } from '../dto/create-project.dto';
import { ProjectsService } from '../services/projects.service';
import { UpdateProjectDTO } from '../dto/update-project.dto';

@ApiTags('programs')
@Controller('programs')
export class ProgramsController {
  constructor(
    private readonly programsService: ProgramsService,
    private readonly projectsService: ProjectsService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get all active programs (public)' })
  async getPrograms(@Query() query: FilterProgramsDTO) {
    return this.programsService.findPublicPrograms(
      {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
      query.category,
    );
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all programs with any status (admin only)' })
  async getAdminPrograms(@Query() query: FilterProgramsDTO) {
    return this.programsService.findAdminPrograms(
      {
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
      query.status,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get program details by ID (public)' })
  async getProgram(@Param('id') id: string) {
    return this.programsService.findProgramById(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get program statistics (public)' })
  async getProgramStats(@Param('id') id: string) {
    return this.programsService.getProgramWithStats(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'coverImage', maxCount: 1 },
      { name: 'logo', maxCount: 1 },
    ], {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(new BadRequestException(`File type ${file.mimetype} not allowed`), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiBody({
    description: 'Create a new program with images',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: '{"en":"Women Entrepreneurship Program","rw":"Porogaramu yubucuruzi bwabagore"}' },
        description: { type: 'string', example: '{"en":"Empowering women through business training","rw":"Gutera imbaraga abagore"}' },
        category: { type: 'string', example: 'entrepreneurship' },
        sdgAlignment: { type: 'string', example: '[1,5,8]' }, // Changed to string in Swagger
        kpiTargets: { type: 'string', example: '{"beneficiaries":100,"capitalGrowth":50}' }, // Changed to string
        startDate: { type: 'string', format: 'date', example: '2026-03-01' },
        endDate: { type: 'string', format: 'date', example: '2026-12-31' },
        budget: { type: 'number', example: 50000000 },
        status: { type: 'string', example: 'active' },
        projects: { type: 'string', example: '[]' }, // Changed to string
        coverImage: { type: 'string', format: 'binary' },
        logo: { type: 'string', format: 'binary' },
      },
      required: ['name', 'description', 'category', 'sdgAlignment', 'kpiTargets', 'startDate', 'budget']
    },
  })
  @ApiOperation({ summary: 'Create a new program (admin only)' })
  async createProgram(
    @Body() data: CreateProgramDTO,
    @UploadedFiles() files: {
      coverImage?: Express.Multer.File[];
      logo?: Express.Multer.File[];
    },
  ) {

    return this.programsService.createProgram(
      data,
      files?.coverImage?.[0],
      files?.logo?.[0],
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'coverImage', maxCount: 1 },
      { name: 'logo', maxCount: 1 },
    ], {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(new BadRequestException(`File type ${file.mimetype} not allowed`), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiBody({
    description: 'Update program with optional images',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: '{"en":"Updated Program Name","rw":"Porogaramu yihariye"}' },
        description: { type: 'string', example: '{"en":"Updated description","rw":"Ibisobanuro byahinduwe"}' },
        category: { type: 'string', example: 'entrepreneurship' },
        sdgAlignment: { type: 'string', example: '[1,5,8]' },
        kpiTargets: { type: 'string', example: '{"beneficiaries":150}' },
        startDate: { type: 'string', format: 'date', example: '2024-01-01' },
        endDate: { type: 'string', format: 'date', example: '2024-12-31' },
        budget: { type: 'number', example: 60000000 },
        status: { type: 'string', example: 'active' },
        projects: { type: 'string', example: '[]' },
        coverImage: { type: 'string', format: 'binary' },
        logo: { type: 'string', format: 'binary' },
      }
    },
  })
  @ApiOperation({ summary: 'Update a program (admin only)' })
  async updateProgram(
    @Param('id') id: string,
    @Body() data: UpdateProgramDTO,
    @UploadedFiles()
    files?: {
      coverImage?: Express.Multer.File[];
      logo?: Express.Multer.File[];
    },
  ) {
    return this.programsService.updateProgram(
      id,
      data,
      files?.coverImage?.[0],
      files?.logo?.[0],
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a program (admin only)' })
  async deleteProgram(@Param('id') id: string) {
    await this.programsService.deleteProgram(id);
    return { message: 'Program deleted successfully' };
  }

  // ================= ADDITIONAL MEDIA ENDPOINTS =================

  @Post(':id/cover')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

      if (!allowedMimes.includes(file.mimetype)) {
        return cb(
          new BadRequestException(
            `File type ${file.mimetype} not allowed. Allowed types: JPEG, PNG, WebP`
          ),
          false,
        );
      }

      if (file.size > 10 * 1024 * 1024) {
        return cb(
          new BadRequestException('File size must not exceed 10MB'),
          false,
        );
      }

      cb(null, true);
    },
  }))
  @ApiOperation({ summary: 'Upload only program cover image (admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Cover image file (max 10MB, JPEG/PNG/WebP)'
        },
      },
    },
  })
  async uploadProgramCover(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.programsService.updateProgram(id, {}, file, undefined);
  }

  @Post(':id/logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB for logos
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/svg+xml'];

      if (!allowedMimes.includes(file.mimetype)) {
        return cb(
          new BadRequestException(
            `File type ${file.mimetype} not allowed. Allowed types: JPEG, PNG, SVG`
          ),
          false,
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        return cb(
          new BadRequestException('File size must not exceed 5MB'),
          false,
        );
      }

      cb(null, true);
    },
  }))
  @ApiOperation({ summary: 'Upload only program logo (admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Logo file (max 5MB, JPEG/PNG/SVG)'
        },
      },
    },
  })
  async uploadProgramLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.programsService.updateProgram(id, {}, undefined, file);
  }

  // ================= PROJECT ENDPOINTS (NESTED UNDER PROGRAMS) =================

  @Get(':programId/projects')
  @ApiOperation({ summary: 'Get all projects for a program (public)' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean })
  async getProgramProjects(
    @Param('programId') programId: string,
    @Query('isActive') isActive?: boolean,
    @Query('isFeatured') isFeatured?: boolean,
  ) {
    return this.projectsService.getProjectsByProgram(programId, {
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
    });
  }

  @Get(':programId/projects/:projectId')
  @ApiOperation({ summary: 'Get a specific project under a program (public)' })
  async getProgramProject(
    @Param('programId') programId: string,
    @Param('projectId') projectId: string,
  ) {
    await this.projectsService.validateProgramAndProject(programId, projectId);
    return this.projectsService.getProjectDetails(projectId);
  }

  // ✅ CREATE PROJECT WITH COVER IMAGE AND GALLERY
  @Post(':programId/projects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'coverImage', maxCount: 1 },
      { name: 'gallery', maxCount: 10 },
    ], {
      limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max for gallery videos
      },
      fileFilter: (req, file, cb) => {
        if (file.fieldname === 'coverImage') {
          const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
          if (!allowedMimes.includes(file.mimetype)) {
            return cb(new BadRequestException(`Cover image type ${file.mimetype} not allowed`), false);
          }
          if (file.size > 10 * 1024 * 1024) {
            return cb(new BadRequestException('Cover image size must not exceed 10MB'), false);
          }
        }

        if (file.fieldname === 'gallery') {
          const isImage = file.mimetype.startsWith('image/');
          const isVideo = file.mimetype.startsWith('video/');

          if (!isImage && !isVideo) {
            return cb(new BadRequestException('Gallery files must be images or videos'), false);
          }

          if (isImage && file.size > 10 * 1024 * 1024) {
            return cb(new BadRequestException('Gallery image size must not exceed 10MB'), false);
          }

          if (isVideo && file.size > 100 * 1024 * 1024) {
            return cb(new BadRequestException('Gallery video size must not exceed 100MB'), false);
          }
        }

        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Create a project under a program with cover image and gallery (admin only)' })
  @ApiBody({
    description: 'Create a new project with optional cover image and gallery files',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: '{"en":"Women in Tech Training","rw":"Amahugurwa yabagore mu ikoranabuhanga"}'
        },
        description: {
          type: 'string',
          example: '{"en":"Training program for women in technology","rw":"Porogaramu yamahugurwa yabagore mu ikoranabuhanga"}'
        },
        budgetRequired: { type: 'number', example: 15000000 },
        timeline: {
          type: 'string',
          example: '{"start":"2026-03-01","end":"2026-12-31","milestones":[]}'
        },
        location: {
          type: 'string',
          example: '{"districts":["Kicukiro","Gasabo"],"sectors":["Gikondo","Niboyi"]}'
        },
        impactMetrics: {
          type: 'string',
          example: '{"beneficiariesTarget":500,"beneficiariesReached":0,"successIndicators":[]}'
        },
        coverImage: {
          type: 'string',
          format: 'binary',
          description: 'Project cover image (max 10MB, JPEG/PNG/WebP)'
        },
        gallery: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Gallery images/videos (max 10 files, 10MB images, 100MB videos)'
        },
        galleryCaptions: {
          type: 'string',
          example: '["Caption 1","Caption 2"]',
          description: 'JSON string array of captions for gallery files'
        }
      },
      required: ['name', 'description', 'budgetRequired']
    },
  })
  async createProgramProject(
    @Param('programId') programId: string,
    @Body() data: CreateProjectDTO,
    @UploadedFiles() files: {
      coverImage?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
    @Body('galleryCaptions') galleryCaptionsStr?: string,
  ) {

    let galleryCaptions: string[] = [];

    if (galleryCaptionsStr) {
      try {
        // Try to parse as JSON first
        galleryCaptions = JSON.parse(galleryCaptionsStr);
      } catch {
        // If JSON parsing fails, treat as comma-separated string
        galleryCaptions = galleryCaptionsStr.split(',').map(s => s.trim());
      }
    }

    const galleryFiles = files?.gallery || [];
    while (galleryCaptions.length < galleryFiles.length) {
      galleryCaptions.push(`Gallery item ${galleryCaptions.length + 1}`);
    }

    return this.projectsService.createProjectWithGallery(
      programId,
      data,
      files?.coverImage?.[0],
      galleryFiles,
      galleryCaptions,
    );
  }

  // ✅ UPDATE PROJECT WITH COVER IMAGE AND GALLERY
  @Patch(':programId/projects/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'coverImage', maxCount: 1 },
      { name: 'gallery', maxCount: 10 },
      { name: 'galleryPublicIds', maxCount: 10 }, // For updating specific gallery items
      { name: 'galleryCaptions', maxCount: 10 }, // For updating gallery captions
    ], {
      limits: {
        fileSize: 100 * 1024 * 1024
      },
      fileFilter: (req, file, cb) => {
        if (file.fieldname === 'coverImage') {
          const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
          if (!allowedMimes.includes(file.mimetype)) {
            return cb(new BadRequestException(`Cover image type ${file.mimetype} not allowed`), false);
          }
          if (file.size > 10 * 1024 * 1024) {
            return cb(new BadRequestException('Cover image size must not exceed 10MB'), false);
          }
        }

        if (file.fieldname === 'gallery') {
          const isImage = file.mimetype.startsWith('image/');
          const isVideo = file.mimetype.startsWith('video/');

          if (!isImage && !isVideo) {
            return cb(new BadRequestException('Gallery files must be images or videos'), false);
          }

          if (isImage && file.size > 10 * 1024 * 1024) {
            return cb(new BadRequestException('Gallery image size must not exceed 10MB'), false);
          }

          if (isVideo && file.size > 100 * 1024 * 1024) {
            return cb(new BadRequestException('Gallery video size must not exceed 100MB'), false);
          }
        }

        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Update a project with cover image and gallery (admin only)' })
  @ApiBody({
    description: 'Update project details, cover image, and gallery',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          example: '{"en":"Updated Project Name","rw":"Izina ryahinduwe"}'
        },
        description: {
          type: 'string',
          example: '{"en":"Updated description","rw":"Ibisobanuro byahinduwe"}'
        },
        budgetRequired: { type: 'number', example: 20000000 },
        timeline: {
          type: 'string',
          example: '{"start":"2026-04-01","end":"2026-11-30","milestones":[]}'
        },
        location: {
          type: 'string',
          example: '{"districts":["Kicukiro"],"sectors":["Gikondo"]}'
        },
        impactMetrics: {
          type: 'string',
          example: '{"beneficiariesTarget":600}'
        },
        isActive: { type: 'boolean', example: true },
        isFeatured: { type: 'boolean', example: false },
        coverImage: {
          type: 'string',
          format: 'binary',
          description: 'New cover image (replaces existing)'
        },
        gallery: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'New gallery files to add'
        },
        galleryCaptions: {
          type: 'string',
          example: '["New caption 1","New caption 2"]',
          description: 'Captions for new gallery files'
        },
        updateGalleryItems: {
          type: 'string',
          example: '[{"publicId":"abc123","caption":"Updated caption"}]',
          description: 'JSON string array of gallery items to update captions'
        },
        removeGalleryItems: {
          type: 'string',
          example: '["publicId1","publicId2"]',
          description: 'JSON string array of publicIds to remove from gallery'
        }
      }
    },
  })
  async updateProgramProject(
    @Param('programId') programId: string,
    @Param('projectId') projectId: string,
    @Body() data: UpdateProjectDTO,
    @UploadedFiles() files: {
      coverImage?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    },
    @Body('galleryCaptions') galleryCaptionsStr?: string,
    @Body('updateGalleryItems') updateGalleryItemsStr?: string,
    @Body('removeGalleryItems') removeGalleryItemsStr?: string,
  ) {
      let galleryCaptions: string[] = [];
  if (galleryCaptionsStr) {
    try {
      galleryCaptions = JSON.parse(galleryCaptionsStr);
    } catch {
      galleryCaptions = galleryCaptionsStr.split(',').map(s => s.trim());
    }
  }

  // ✅ Parse other JSON strings
  let updateGalleryItems = [];
  if (updateGalleryItemsStr) {
    try {
      updateGalleryItems = JSON.parse(updateGalleryItemsStr);
    } catch {
      // Handle comma-separated format if needed
      console.error('Invalid updateGalleryItems JSON');
    }
  }

  let removeGalleryItems: string[] = [];
  if (removeGalleryItemsStr) {
    try {
      removeGalleryItems = JSON.parse(removeGalleryItemsStr);
    } catch {
      removeGalleryItems = removeGalleryItemsStr.split(',').map(s => s.trim());
    }
  }

  // Ensure captions match gallery files
  const galleryFiles = files?.gallery || [];
  while (galleryCaptions.length < galleryFiles.length) {
    galleryCaptions.push(`Gallery item ${galleryCaptions.length + 1}`);
  }

  return this.projectsService.updateProjectWithMedia(
    programId,
    projectId,
    data,
    files?.coverImage?.[0],
    galleryFiles,
    galleryCaptions,
    updateGalleryItems,
    removeGalleryItems,
  );
  }

  @Delete(':programId/projects/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a project under a program (admin only)' })
  async deleteProgramProject(
    @Param('programId') programId: string,
    @Param('projectId') projectId: string,
  ) {
    await this.projectsService.deleteProject(programId, projectId);
    return { message: 'Project deleted successfully' };
  }

  @Post(':programId/projects/:projectId/cover')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new BadRequestException(`File type ${file.mimetype} not allowed`), false);
      }
      cb(null, true);
    },
  }))
  @ApiOperation({ summary: 'Upload/Replace project cover image (admin only)' })
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
  async uploadProgramProjectCover(
    @Param('programId') programId: string,
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.projectsService.uploadProjectCover(programId, projectId, file);
  }

  @Post(':programId/projects/:projectId/gallery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10, {
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const isImage = file.mimetype.startsWith('image/');
      const isVideo = file.mimetype.startsWith('video/');

      if (!isImage && !isVideo) {
        return cb(new BadRequestException('Only image and video files are allowed'), false);
      }
      cb(null, true);
    },
  }))
  @ApiOperation({ summary: 'Add gallery files to project (admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Gallery images/videos (max 10 files)'
        },
        captions: {
          type: 'string',
          example: '["Caption 1","Caption 2"]',
          description: 'JSON string array of captions for each file'
        }
      }
    }
  })
  async uploadProgramProjectGallery(
    @Param('programId') programId: string,
    @Param('projectId') projectId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('captions') captionsStr?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const captions = captionsStr ? JSON.parse(captionsStr) : [];

    const results = await this.projectsService.addGalleryItems(
      programId,
      projectId,
      files,
      captions
    );

    const lastProject = results[results.length - 1];

    return {
      message: `Successfully added ${files.length} file(s) to gallery`,
      data: {
        projectId: lastProject.id,
        programId,
        galleryCount: lastProject.gallery?.length || 0,
        addedItems: lastProject.gallery?.slice(-files.length).map(item => ({
          url: item.url,
          publicId: item.publicId,
          type: item.type,
          caption: item.caption
        }))
      }
    };
  }

  @Patch(':programId/projects/:projectId/gallery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update gallery item captions (admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'string',
          example: '[{"publicId":"abc123","caption":"Updated caption"}]',
          description: 'JSON string array of gallery items to update'
        }
      }
    }
  })
  async updateProgramProjectGalleryCaptions(
    @Param('programId') programId: string,
    @Param('projectId') projectId: string,
    @Body('items') itemsStr: string,
  ) {
    const items = JSON.parse(itemsStr);
    return this.projectsService.updateGalleryCaptions(programId, projectId, items);
  }

  @Delete(':programId/projects/:projectId/gallery/:publicId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete image from project gallery (admin only)' })
  async deleteProgramProjectGalleryItem(
    @Param('programId') programId: string,
    @Param('projectId') projectId: string,
    @Param('publicId') publicId: string,
  ) {
    return this.projectsService.deleteGalleryItem(programId, projectId, publicId);
  }

  @Delete(':programId/projects/:projectId/gallery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete multiple gallery items (admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        publicIds: {
          type: 'string',
          example: '["publicId1","publicId2"]',
          description: 'JSON string array of publicIds to delete'
        }
      }
    }
  })
  async deleteProgramProjectGalleryItems(
    @Param('programId') programId: string,
    @Param('projectId') projectId: string,
    @Body('publicIds') publicIdsStr: string,
  ) {
    const publicIds = JSON.parse(publicIdsStr);
    return this.projectsService.deleteGalleryItems(programId, projectId, publicIds);
  }
}