// src/modules/programs/controllers/projects.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserType } from '../../../config/constants';

import { ProjectsService } from '../services/projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  // ================= PUBLIC ENDPOINTS =================

  @Get(':projectId')
  @ApiOperation({ summary: 'Get project details (public)' })
  async getProject(@Param('projectId') projectId: string) {
    return this.projectsService.getProjectDetails(projectId);
  }

  // ================= ADMIN ENDPOINTS =================
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