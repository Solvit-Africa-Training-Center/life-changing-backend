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
} from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
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
    ]),
  )
  @ApiOperation({ summary: 'Create a new program (admin only)' })
  async createProgram(
    @Body() data: CreateProgramDTO,
    @UploadedFiles()
    files: {
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
    ]),
  )
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
}