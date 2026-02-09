// src/modules/beneficiaries/controllers/beneficiaries.controller.ts
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
import { BeneficiariesService } from '../services/beneficiaries.service';
import { CreateBeneficiaryDto } from '../dto/create-beneficiary.dto';
import { UpdateBeneficiaryDto } from '../dto/update-beneficiary.dto';
import type { PaginationParams } from '../../../shared/interfaces/pagination.interface';
import { BeneficiaryStatus, ProgramCategory, ProgramStatus, UserType } from '../../../config/constants';
import { BeneficiaryStatsDto } from '../dto/beneficiary-stats.dto';
import { Beneficiary } from '../entities/beneficiary.entity';
import { AssignProgramDto } from '../dto/assign-program.dto';

@ApiTags('beneficiaries')
@Controller('beneficiaries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BeneficiariesController {
    constructor(private readonly beneficiariesService: BeneficiariesService) { }

    @Post('profile')
    @Roles(UserType.BENEFICIARY)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Complete beneficiary profile' })
    @ApiResponse({ status: 201, description: 'Beneficiary profile completed' })
    async createBeneficiaryProfile(@Req() req, @Body() createBeneficiaryDto: CreateBeneficiaryDto) {
        // Check if beneficiary profile was created during registration
        const existingBeneficiary = await this.beneficiariesService.findBeneficiaryByUserId(req.user.id);

        if (existingBeneficiary) {
            throw new ConflictException('Beneficiary profile already exists. Use PUT /profile to update.');
        }

        // CREATE the profile (requires all mandatory fields from DTO)
        return this.beneficiariesService.createBeneficiary(req.user.id, createBeneficiaryDto);
    }

    @Get('profile')
    @Roles(UserType.BENEFICIARY, UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get beneficiary profile' })
    @ApiResponse({ status: 200, description: 'Beneficiary profile returned' })
    async getBeneficiaryProfile(@Req() req) {
        return this.beneficiariesService.findBeneficiaryByUserId(req.user.id);
    }

    @Put('profile')
    @Roles(UserType.BENEFICIARY, UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update beneficiary profile' })
    @ApiResponse({ status: 200, description: 'Beneficiary profile updated' })
    async updateBeneficiaryProfile(@Req() req, @Body() updateBeneficiaryDto: UpdateBeneficiaryDto) {
        const beneficiary = await this.beneficiariesService.findBeneficiaryByUserId(req.user.id);
        if (!beneficiary) {
            throw new NotFoundException('Beneficiary profile not found');
        }
        return this.beneficiariesService.updateBeneficiary(beneficiary.id, updateBeneficiaryDto);
    }

    @Get('profile/status')
    @Roles(UserType.BENEFICIARY, UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Check beneficiary profile completion status' })
    @ApiResponse({ status: 200, description: 'Profile status returned' })
    async getProfileStatus(@Req() req) {

        const beneficiary = await this.beneficiariesService.findBeneficiaryByUserId(req.user.id);

        if (!beneficiary) {
            return {
                hasProfile: false,
                isComplete: false,
                basicProfileComplete: false,
                programEnrolled: false,
                completionPercentage: 0,
                basicProfilePercentage: 0,
                programEnrollmentPercentage: 0,
                missingFields: {
                    basicProfile: ['profile_not_created'],
                    programEnrollment: ['program', 'enrollmentDate']
                },
                profile: null
            };
        }

        const { basicProfileMissing, programEnrollmentMissing } = this.getMissingBeneficiaryFields(beneficiary);
        const { basicProfilePercentage, programEnrollmentPercentage, overallPercentage } =
            this.calculateCompletionPercentage(basicProfileMissing, programEnrollmentMissing);

        const isBasicProfileComplete = basicProfileMissing.length === 0;
        const isProgramEnrolled = programEnrollmentMissing.length === 0;

        return {
            hasProfile: true,
            isComplete: isBasicProfileComplete && isProgramEnrolled,
            basicProfileComplete: isBasicProfileComplete,
            programEnrolled: isProgramEnrolled,
            completionPercentage: overallPercentage,
            basicProfilePercentage,
            programEnrollmentPercentage,
            missingFields: {
                basicProfile: basicProfileMissing,
                programEnrollment: programEnrollmentMissing
            },
            profile: beneficiary
        };
    }

    @Get('attention-required')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get beneficiaries requiring special attention' })
    async getBeneficiariesRequiringAttention(@Query() paginationParams: PaginationParams) {
        return this.beneficiariesService.getBeneficiariesRequiringAttention(paginationParams);
    }


    @Get('search')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Search beneficiaries' })
    async searchBeneficiaries(
        @Query('q') query: string,
        @Query() paginationParams: PaginationParams,
    ) {
        return this.beneficiariesService.searchBeneficiaries(query, paginationParams);
    }

    @Get('stats')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get beneficiary statistics (admin only)' })
    @ApiResponse({
        status: 200,
        description: 'Beneficiary statistics returned',
        type: BeneficiaryStatsDto
    })
    async getBeneficiaryStats(): Promise<BeneficiaryStatsDto> {
        return this.beneficiariesService.getBeneficiaryStats();
    }

    @Get()
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all beneficiaries (admin only)' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'sortBy', required: false })
    @ApiQuery({ name: 'sortOrder', required: false })
    async getAllBeneficiaries(@Query() paginationParams: PaginationParams) {
        return this.beneficiariesService.paginate(paginationParams, {}, ['user', 'program']);
    }

    @Get('unassigned')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get beneficiaries without program assignment' })
    async getUnassignedBeneficiaries(@Query() paginationParams: PaginationParams) {
        return this.beneficiariesService.getUnassignedBeneficiaries(paginationParams);
    }

    @Post('test/create-program')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a test program for development' })
    @ApiResponse({ status: 201, description: 'Test program created' })
    async createTestProgram() {
        // Simple test program data
        const testProgramData = {
            name: {
                en: 'Test Entrepreneurship Program',
                rw: 'Porogaramu yo kugerageza ubucuruzi'
            },
            description: {
                en: 'Test program for development and testing purposes',
                rw: 'Porogaramu yo kugerageza kuri gahunda zo kwiteza imbere no kugerageza'
            },
            category: ProgramCategory.ENTREPRENEURSHIP,
            sdgAlignment: [1, 8, 10],
            kpiTargets: {
                beneficiaries: 50,
                capitalGrowth: 30,
                jobCreation: 20
            },
            startDate: new Date(),
            budget: 10000000,
            status: ProgramStatus.ACTIVE,
        };

        try {
            const program = await this.beneficiariesService['programsRepository'].save(
                this.beneficiariesService['programsRepository'].create(testProgramData)
            );

            return {
                message: 'Test program created successfully',
                program: {
                    id: program.id,
                    name: program.name.en,
                    status: program.status,
                    startDate: program.startDate,
                },
                note: 'Use this programId when creating beneficiaries for testing'
            };
        } catch (error) {
            // If program already exists, return existing one
            const existingProgram = await this.beneficiariesService['programsRepository'].findOne({
                where: { name: testProgramData.name }
            });

            if (existingProgram) {
                return {
                    message: 'Test program already exists',
                    program: {
                        id: existingProgram.id,
                        name: existingProgram.name.en,
                        status: existingProgram.status,
                        startDate: existingProgram.startDate,
                    }
                };
            }

            throw error;
        }
    }

    @Get('test/programs')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all available programs for testing' })
    async getTestPrograms() {
        const programs = await this.beneficiariesService['programsRepository'].find({
            select: ['id', 'name', 'status', 'category', 'startDate', 'budget'],
        });

        return {
            programs: programs.map(p => ({
                id: p.id,
                name: p.name?.en || 'No name',
                status: p.status,
                category: p.category,
                startDate: p.startDate,
                budget: p.budget,
            })),
            total: programs.length,
        };
    }
    @Post(':id/assign-program')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Assign beneficiary to a program' })
    async assignProgram(
        @Param('id') beneficiaryId: string,
        @Body() assignProgramDto: AssignProgramDto
    ) {
        return this.beneficiariesService.assignProgram(beneficiaryId, assignProgramDto);
    }

    @Get('program/:programId')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get beneficiaries by program' })
    async getBeneficiariesByProgram(
        @Param('programId') programId: string,
        @Query() paginationParams: PaginationParams,
    ) {
        return this.beneficiariesService.getBeneficiariesByProgram(programId, paginationParams);
    }

    @Get('status/:status')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get beneficiaries by status' })
    async getBeneficiariesByStatus(
        @Param('status') status: BeneficiaryStatus,
        @Query() paginationParams: PaginationParams,
    ) {
        return this.beneficiariesService.getBeneficiariesByStatus(status, paginationParams);
    }


    @Put(':id/graduate')
    @Roles(UserType.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Graduate beneficiary (admin only)' })
    async graduateBeneficiary(@Param('id') id: string) {
        return this.beneficiariesService.graduateBeneficiary(id);
    }

    @Delete(':id')
    @Roles(UserType.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete beneficiary (admin only)' })
    async deleteBeneficiary(@Param('id') id: string) {
        await this.beneficiariesService.delete(id);
    }

    private getMissingBeneficiaryFields(beneficiary: Beneficiary): {
        basicProfileMissing: string[];
        programEnrollmentMissing: string[];
    } {
        const basicProfileMissing: string[] = [];
        const programEnrollmentMissing: string[] = [];

        // Required fields for basic profile
        if (!beneficiary.dateOfBirth) basicProfileMissing.push('dateOfBirth');

        // Check location details
        if (!beneficiary.location ||
            !beneficiary.location.district ||
            !beneficiary.location.sector ||
            !beneficiary.location.cell ||
            !beneficiary.location.village) {
            basicProfileMissing.push('location_details');
        }

        if (!beneficiary.startCapital && beneficiary.startCapital !== 0) basicProfileMissing.push('startCapital');
        if (!beneficiary.businessType) basicProfileMissing.push('businessType');
        if (!beneficiary.trackingFrequency) basicProfileMissing.push('trackingFrequency');

        // Program enrollment fields (required only if they want to be in a program)
        if (!beneficiary.program) {
            programEnrollmentMissing.push('program');
        } else if (!beneficiary.enrollmentDate) {
            programEnrollmentMissing.push('enrollmentDate');
        }

        return {
            basicProfileMissing,
            programEnrollmentMissing
        };
    }
    private calculateCompletionPercentage(basicProfileMissing: string[], programEnrollmentMissing: string[]): {
        basicProfilePercentage: number;
        programEnrollmentPercentage: number;
        overallPercentage: number;
    } {
        const totalBasicFields = 5; // dateOfBirth, location, startCapital, businessType, trackingFrequency
        const totalProgramFields = 2; // program, enrollmentDate

        const basicCompleted = totalBasicFields - basicProfileMissing.length;
        const programCompleted = totalProgramFields - programEnrollmentMissing.length;

        const basicProfilePercentage = Math.round((basicCompleted / totalBasicFields) * 100);
        const programEnrollmentPercentage = Math.round((programCompleted / totalProgramFields) * 100);

        // Overall percentage (weight basic profile more heavily)
        const overallPercentage = Math.round(((basicCompleted + programCompleted) / (totalBasicFields + totalProgramFields)) * 100);

        return {
            basicProfilePercentage,
            programEnrollmentPercentage,
            overallPercentage
        };
    }
}
