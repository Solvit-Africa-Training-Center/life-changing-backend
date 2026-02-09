// src/modules/admin/controllers/staff.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
    NotFoundException,
    ConflictException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { StaffService } from '../services/staff.service';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { UpdateStaffDto } from '../dto/update-staff.dto';
import type { PaginationParams } from '../../../shared/interfaces/pagination.interface';
import { UserType } from '../../../config/constants';
import { StaffStatsDto } from '../dto/staff-stats.dto';
import { Staff } from '../entities/staff.entity';

@ApiTags('staff')
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
    constructor(private readonly staffService: StaffService) { }

    @Post('profile')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Complete staff profile' })
    @ApiResponse({ status: 201, description: 'Staff profile completed' })
    async createStaffProfile(@Req() req, @Body() createStaffDto: CreateStaffDto) {
        // Get staff profile that was created during registration
        const existingStaff = await this.staffService.findStaffByUserId(req.user.id);

        if (existingStaff) {
            throw new ConflictException('Staff profile already exists. Use PUT /profile to update.');
        }

        return this.staffService.createStaff(req.user.id, createStaffDto);
    }

    @Get('profile')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get staff profile' })
    @ApiResponse({ status: 200, description: 'Staff profile returned' })
    async getStaffProfile(@Req() req) {
        const staff = await this.staffService.findStaffByUserId(req.user.id);
        if (!staff) {
            throw new NotFoundException('Staff profile not found');
        }
        return staff;
    }

    @Put('profile')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update staff profile' })
    @ApiResponse({ status: 200, description: 'Staff profile updated' })
    async updateStaffProfile(@Req() req, @Body() updateStaffDto: UpdateStaffDto) {
        const staff = await this.staffService.findStaffByUserId(req.user.id);
        if (!staff) {
            throw new NotFoundException('Staff profile not found');
        }
        return this.staffService.updateStaff(staff.id, updateStaffDto);
    }

    @Get()
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all staff (admin only)' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'sortBy', required: false })
    @ApiQuery({ name: 'sortOrder', required: false })
    async getAllStaff(@Query() paginationParams: PaginationParams) {
        return this.staffService.paginate(paginationParams, {}, ['user']);
    }

    @Get('department/:department')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get staff by department' })
    async getStaffByDepartment(
        @Param('department') department: string,
        @Query() paginationParams: PaginationParams,
    ) {
        return this.staffService.getStaffByDepartment(department, paginationParams);
    }

    @Get('search')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Search staff' })
    async searchStaff(
        @Query('q') query: string,
        @Query() paginationParams: PaginationParams,
    ) {
        return this.staffService.searchStaff(query, paginationParams);
    }

    @Get('stats')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get staff statistics' })
    async getStaffStats() {
        return this.staffService.getStaffStats();
    }

    @Get('profile/status')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Check staff profile completion status' })
    async getProfileStatus(@Req() req) {
        const staff = await this.staffService.findStaffByUserId(req.user.id);

        if (!staff) {
            return {
                hasProfile: false,
                isComplete: false,
                missingFields: ['profile_not_created'],
                profile: null
            };
        }

        // Optional fields - no required fields
        const missingFields: string[] = [];

        return {
            hasProfile: true,
            isComplete: true, // All staff fields are optional
            missingFields,
            profile: staff
        };
    }
}