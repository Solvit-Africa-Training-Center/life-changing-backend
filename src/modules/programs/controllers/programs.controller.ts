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
import { ApiTags, ApiConsumes, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ProgramStatus, UserType } from '../../../config/constants';

import { ProgramsService } from '../services/programs.service';
import { FilterProgramsDTO } from '../dto/filter-programs.dto';
import { CreateProgramDTO } from '../dto/create-program.dto';
import { UpdateProgramDTO } from '../dto/update-program.dto';

@ApiTags('programs')
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) { }

  // In ProgramsController
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
}