import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { BeneficiariesService } from './beneficiaries.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('beneficiaries')
@UseGuards(JwtAuthGuard)
export class BeneficiariesController {
    constructor(private readonly beneficiariesService: BeneficiariesService) { }

    @Get('my-program')
    async getMyProgram(@Req() req) {
        return this.beneficiariesService.getProgramInfo(req.user.id);
    }

    @Get('my-updates')
    async getMyUpdates(@Req() req) {
        return this.beneficiariesService.getUpdates(req.user.id);
    }

    @Get('ussd-summary')
    async getUSSDSummary(@Req() req) {
        return this.beneficiariesService.getUSSDSummary(req.user.id);
    }
}
