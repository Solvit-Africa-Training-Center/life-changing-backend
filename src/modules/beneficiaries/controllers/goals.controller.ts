import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
  HttpStatus,
  HttpCode,
  ForbiddenException,
  NotFoundException,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentBeneficiary } from '../../../common/decorators/current-beneficiary.decorator';
import { GoalsService } from '../services/goals.service';
import { CreateGoalDto, UpdateGoalDto } from '../dto/create-goal.dto';
import { GoalType, GoalStatus, UserType } from '../../../config/constants';
import type { PaginationParams } from '../../../shared/interfaces/pagination.interface';
import { Beneficiary } from '../entities/beneficiary.entity';
import { Goal } from '../entities/goal.entity';
import { BeneficiaryServiceInterceptor } from 'src/common/interceptors/beneficiary-service.interceptor';
import { UpdateProgressDto } from '../dto/update-progress.dto';

@ApiTags('beneficiaries')
@Controller('beneficiaries/goals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UseInterceptors(BeneficiaryServiceInterceptor)
export class GoalsController {
  constructor(
    private readonly goalsService: GoalsService,
  ) { }

  @Post()
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Create a goal' })
  async createGoal(
    @CurrentBeneficiary() beneficiary: Beneficiary,
    @Body() createGoalDto: CreateGoalDto
  ) {
    return this.goalsService.createGoal(beneficiary.id, createGoalDto);
  }

  @Get()
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get goals' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getGoals(
    @CurrentBeneficiary() beneficiary: Beneficiary,
    @Query() paginationParams: PaginationParams
  ) {
    return this.goalsService.getBeneficiaryGoals(beneficiary.id, paginationParams);
  }

  @Get('type/:goalType')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get goals by type' })
  async getGoalsByType(
    @CurrentBeneficiary() beneficiary: Beneficiary,
    @Param('goalType') goalType: GoalType,
    @Query() paginationParams: PaginationParams
  ) {
    return this.goalsService.getGoalsByType(beneficiary.id, goalType, paginationParams);
  }

  @Get('status/:status')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get goals by status' })
  async getGoalsByStatus(
    @CurrentBeneficiary() beneficiary: Beneficiary,
    @Param('status') status: GoalStatus,
    @Query() paginationParams: PaginationParams
  ) {
    return this.goalsService.getGoalsByStatus(beneficiary.id, status, paginationParams);
  }

  @Put(':id/progress')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Update goal progress' })
  @ApiBody({ type: UpdateProgressDto })
  async updateGoalProgress(
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateProgressDto,
    @CurrentBeneficiary() beneficiary: Beneficiary
  ) {
    await this.checkGoalOwnership(id, beneficiary.id);
    return this.goalsService.updateGoalProgress(id, updateProgressDto.progress);
  }

  @Get('stats')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get goal statistics' })
  async getGoalStats(@CurrentBeneficiary() beneficiary: Beneficiary) {
    return this.goalsService.getGoalStats(beneficiary.id);
  }

  @Put(':id')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Update goal' })
  @ApiBody({ type: UpdateGoalDto })
  async updateGoal(
    @Param('id') id: string,
    @Body() updateGoalDto: UpdateGoalDto,
    @CurrentBeneficiary() beneficiary: Beneficiary
  ) {
    await this.checkGoalOwnership(id, beneficiary.id);
    return this.goalsService.update(id, updateGoalDto);
  }

  @Delete(':id')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete goal' })
  async deleteGoal(
    @Param('id') id: string,
    @CurrentBeneficiary() beneficiary: Beneficiary
  ) {
    await this.checkGoalOwnership(id, beneficiary.id);
    await this.goalsService.delete(id);
  }

  @Get(':id')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get goal by ID' })
  async getGoalById(
    @Param('id') id: string,
    @CurrentBeneficiary() beneficiary: Beneficiary
  ) {
    await this.checkGoalOwnership(id, beneficiary.id);
    return this.goalsService.findOne(id, ['beneficiary']);
  }

  private async checkGoalOwnership(goalId: string, beneficiaryId: string): Promise<void> {
    const goal = await this.goalsService.findOne(goalId, ['beneficiary']);

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.beneficiary.id !== beneficiaryId) {
      throw new ForbiddenException('You do not have permission to access this goal');
    }
  }
}