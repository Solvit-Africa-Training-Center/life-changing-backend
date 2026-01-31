// eslint-disable-next-line no-redeclare
import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  getPrograms(@Query() query: FilterProgramsDTO) {
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
  getProgram(@Param('id') id: string) {
    return this.programsService.findProgramById(id);
  }

  // ---------- ADMIN ----------
  @Get('admin/list')
  getAdminPrograms(@Query() query: FilterProgramsDTO) {
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

  @Post()
  createProgram(@Body() data: CreateProgramDTO) {
    return this.programsService.createProgram(data);
  }

  @Patch(':id')
  updateProgram(@Param('id') id: string, @Body() data: UpdateProgramDTO) {
    return this.programsService.updateProgram(id, data);
  }

  @Patch(':id/deactivate')
  deactivateProgram(@Param('id') id: string) {
    return this.programsService.deactivateProgram(id);
  }
}
