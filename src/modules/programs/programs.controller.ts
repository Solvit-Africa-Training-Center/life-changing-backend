import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  // eslint-disable-next-line no-redeclare
  Body,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { ProgramsService } from './programs.service';
import { CreateProgramDTO } from './dto/create-program.dto';
import { UpdateProgramDTO } from './dto/update-program.dto';
import { FilterProgramsDTO } from './dto/filter-programs.dto';

@ApiTags('Programs')
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  // ---------- PUBLIC ----------
  @Get()
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

  @Get(':id')
  async getProgram(@Param('id') id: string) {
    return this.programsService.findProgramById(id);
  }

  // ---------- ADMIN ----------
  @Get('admin/list')
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

  // ⭐ CREATE PROGRAM (WITH CLOUDINARY)
  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'coverImage', maxCount: 1 },
      { name: 'logo', maxCount: 1 },
    ]),
  )
  async createProgram(
    @Body() data: CreateProgramDTO,
    @UploadedFiles()
    files: {
      // eslint-disable-next-line no-undef
      coverImage?: Express.Multer.File[];
      // eslint-disable-next-line no-undef
      logo?: Express.Multer.File[];
    },
  ) {
    return this.programsService.createProgram(data, files?.coverImage?.[0], files?.logo?.[0]);
  }

  // ⭐ UPDATE PROGRAM
  @Patch(':id')
  async updateProgram(@Param('id') id: string, @Body() data: UpdateProgramDTO) {
    return this.programsService.updateProgram(id, data as any);
  }

  // ⭐ DEACTIVATE PROGRAM
  @Patch(':id/deactivate')
  async deactivateProgram(@Param('id') id: string) {
    return this.programsService.deactivateProgram(id);
  }
}
