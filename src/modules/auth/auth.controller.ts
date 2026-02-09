import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * DEV ONLY
   * Generate admin JWT token for testing protected endpoints
   */
  @Get('dev/admin-token')
  @ApiOperation({ summary: 'DEV: Generate admin JWT token (testing only)' })
  getDevAdminToken() {
    return {
      token: this.authService.generateDevAdminToken(),
    };
  }
}
