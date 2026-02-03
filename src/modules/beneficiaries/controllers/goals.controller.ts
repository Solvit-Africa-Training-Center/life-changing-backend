// src/modules/beneficiaries/controllers/goals.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { GoalsService } from '../services/goals.service';
import { CreateGoalDto, UpdateGoalDto } from '../dto/create-goal.dto';
import { GoalType, GoalStatus, UserType } from '../../../config/constants';
import type { PaginationParams } from '../../../shared/interfaces/pagination.interface';

@ApiTags('beneficiaries')
@Controller('beneficiaries/goals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Create a goal' })
  async createGoal(@Req() req, @Body() createGoalDto: CreateGoalDto) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.goalsService.createGoal(beneficiary.id, createGoalDto);
  }

  @Get()
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get goals' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getGoals(
    @Req() req,
    @Query() paginationParams: PaginationParams
  ) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.goalsService.getBeneficiaryGoals(beneficiary.id, paginationParams);
  }

  @Get('type/:goalType')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get goals by type' })
  async getGoalsByType(
    @Req() req,
    @Param('goalType') goalType: GoalType,
    @Query() paginationParams: PaginationParams
  ) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.goalsService.getGoalsByType(beneficiary.id, goalType, paginationParams);
  }

  @Get('status/:status')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get goals by status' })
  async getGoalsByStatus(
    @Req() req,
    @Param('status') status: GoalStatus,
    @Query() paginationParams: PaginationParams
  ) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.goalsService.getGoalsByStatus(beneficiary.id, status, paginationParams);
  }

  @Put(':id/progress')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Update goal progress' })
  async updateGoalProgress(
    @Param('id') id: string,
    @Body() body: { progress: number }
  ) {
    return this.goalsService.updateGoalProgress(id, body.progress);
  }

  @Get('stats')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get goal statistics' })
  async getGoalStats(@Req() req) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.goalsService.getGoalStats(beneficiary.id);
  }

  private async getBeneficiaryFromRequest(req: any) {
    // Implementation similar to other controllers
  }
}