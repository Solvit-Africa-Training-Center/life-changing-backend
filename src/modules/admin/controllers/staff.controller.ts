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
    NotFoundException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { StaffService } from '../services/staff.service';
import { CreateStaffDto } from '../dto/create-staff.dto';
import { UpdateStaffDto } from '../dto/update-staff.dto';
import type { PaginationParams } from '../../../shared/interfaces/pagination.interface';
import { StaffRole, UserType } from '../../../config/constants';
import { StaffStatsDto } from '../dto/staff-stats.dto';
import { Staff } from '../entities/staff.entity';

@ApiTags('staff')
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
    constructor(private readonly staffService: StaffService) { }

    @Post('profile')  // Changed from @Post()
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Complete staff profile' })
    @ApiResponse({ status: 201, description: 'Staff profile completed' })
    async createStaffProfile(@Req() req, @Body() createStaffDto: CreateStaffDto) {
        // Get staff profile that was created during registration
        const existingStaff = await this.staffService.findStaffByUserId(req.user.id);

        if (!existingStaff) {
            throw new NotFoundException('No staff profile found. Please register first.');
        }

        // Update with additional details
        return this.staffService.updateStaff(existingStaff.id, createStaffDto);
    }

    @Get('profile')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get staff profile' })
    @ApiResponse({ status: 200, description: 'Staff profile returned' })
    async getStaffProfile(@Req() req) {
        return this.staffService.findStaffByUserId(req.user.id);
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

    @Get('role/:role')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get staff by role' })
    async getStaffByRole(
        @Param('role') role: StaffRole,
        @Query() paginationParams: PaginationParams,
    ) {
        return this.staffService.getStaffByRole(role, paginationParams);
    }

    @Put(':id/deactivate')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Deactivate staff (admin only)' })
    async deactivateStaff(@Param('id') id: string) {
        return this.staffService.deactivateStaff(id);
    }

    @Put(':id/activate')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Activate staff (admin only)' })
    async activateStaff(@Param('id') id: string) {
        return this.staffService.activateStaff(id);
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
    @ApiOperation({ summary: 'Get staff statistics (admin only)' })
    @ApiResponse({
        status: 200,
        description: 'Staff statistics returned',
        type: StaffStatsDto
    })
    async getStaffStats(): Promise<StaffStatsDto> {
        return this.staffService.getStaffStats();
    }

    @Delete(':id')
    @Roles(UserType.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete staff (admin only)' })
    async deleteStaff(@Param('id') id: string) {
        await this.staffService.delete(id);
    }

    @Get('profile/status')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Check staff profile completion status' })
    @ApiResponse({
        status: 200,
        description: 'Profile status returned',
        schema: {
            type: 'object',
            properties: {
                hasProfile: { type: 'boolean', example: true },
                isComplete: { type: 'boolean', example: false },
                missingFields: { type: 'array', items: { type: 'string' } },
                profile: { type: 'object' }
            }
        }
    })
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

        const missingFields = this.getMissingStaffFields(staff);

        return {
            hasProfile: true,
            isComplete: missingFields.length === 0,
            missingFields,
            profile: staff
        };
    }

    private getMissingStaffFields(staff: Staff): string[] {
        const missing: string[] = [];

        if (!staff.department) missing.push('department');
        if (!staff.permissions || staff.permissions.length === 0) missing.push('permissions');
        if (!staff.employeeId) missing.push('employeeId');
        if (!staff.hireDate) missing.push('hireDate');

        // Optional but recommended
        if (!staff.contactInfo) {
            missing.push('contactInfo');
        } else if (staff.contactInfo) {
            if (!staff.contactInfo.emergencyContact) missing.push('emergencyContact');
            if (!staff.contactInfo.emergencyPhone) missing.push('emergencyPhone');
            if (!staff.contactInfo.address) missing.push('address');
        }

        return missing;
    }
}