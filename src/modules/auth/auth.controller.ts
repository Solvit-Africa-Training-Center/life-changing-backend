  import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { AuthGuard } from '@nestjs/passport';

  import { AuthService } from './auth.service';
  import { LoginDto } from './dto/login.dto';
  import { RegisterDto } from './dto/register.dto';
  import { RefreshTokenDto } from './dto/refresh-token.dto';
  import { ForgotPasswordDto } from './dto/forgot-password.dto';
  import { ResetPasswordDto } from './dto/reset-password.dto';
  import { VerifyAccountDto } from './dto/verify-account.dto';
  import { Public } from '../../common/decorators/public.decorator';
  import { LoginResponse, RegisterResponse } from './interfaces/auth-response.interface';

  @ApiTags('auth')
  @Controller('auth')
  export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
      return this.authService.login(loginDto);
    }

    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'User registration' })
    @ApiResponse({ status: 201, description: 'Registration successful' })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
      return this.authService.register(registerDto);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Tokens refreshed' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
      return this.authService.refreshTokens(refreshTokenDto);
    }

    @Public()
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request password reset' })
    @ApiResponse({ status: 200, description: 'Reset instructions sent' })
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
      return this.authService.forgotPassword(forgotPasswordDto);
    }

    @Public()
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reset password' })
    @ApiResponse({ status: 200, description: 'Password reset successful' })
    @ApiResponse({ status: 404, description: 'Invalid or expired token' })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
      return this.authService.resetPassword(resetPasswordDto);
    }

    @Public()
    @Post('verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify account' })
    @ApiResponse({ status: 200, description: 'Account verified' })
    @ApiResponse({ status: 404, description: 'Invalid verification token' })
    async verifyAccount(@Body() verifyAccountDto: VerifyAccountDto) {
      return this.authService.verifyAccount(verifyAccountDto);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'User logout' })
    @ApiResponse({ status: 200, description: 'Logged out successfully' })
    async logout(@Req() req) {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      return this.authService.logout(req.user.id, accessToken);
    }

    @Post('me')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile returned' })
    async getProfile(@Req() req) {
      // The user is attached to request by JwtStrategy
      const { password, ...userWithoutPassword } = req.user;
      return userWithoutPassword;
    }
  }