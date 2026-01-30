import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BeneficiariesService } from './beneficiaries.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('beneficiaries')
@ApiBearerAuth()
@Controller('beneficiaries')
@UseGuards(JwtAuthGuard)
export class BeneficiariesController {
    constructor(private readonly beneficiariesService: BeneficiariesService) { }

    @Get('my-program')
    @ApiOperation({ summary: 'Get my program information' })
    async getMyProgram(@Req() req) {
        return this.beneficiariesService.getProgramInfo(req.user.id);
    }

    @Get('profile')
    @ApiOperation({ summary: 'Get my profile' })
    async getProfile(@Req() req) {
        return this.beneficiariesService.getProfile(req.user.id);
    }
}
