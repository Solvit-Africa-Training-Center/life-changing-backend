// src/modules/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/services/users.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyAccountDto } from '../dto/verify-account.dto';
import { Tokens } from '../interfaces/tokens.interface';
import { LoginResponse, RegisterResponse } from '../interfaces/auth-response.interface';
import { LoginService } from './login.service';
import { TokenService } from './token.service';
import { RegistrationService } from './registration.service';
import { PasswordService } from './password.service';
import { VerificationService } from './verification.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private loginService: LoginService,
    private tokenService: TokenService,
    private registrationService: RegistrationService,

    private passwordService: PasswordService,
    private verificationService: VerificationService,
  ) { }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, phone, password, deviceId } = loginDto;

    if (!email && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const identifier = email || phone;
    if (!identifier) {
      throw new BadRequestException('Valid identifier is required');
    }

    const user = await this.validateUser(identifier, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Pass the user to LoginService to handle the rest
    return this.loginService.login(loginDto, user);
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    return this.registrationService.register(registerDto);
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<Tokens> {
    return this.tokenService.refreshTokens(refreshTokenDto);
  }

  async logout(userId: string, accessToken: string, refreshToken?: string): Promise<{ message: string }> {
    return this.tokenService.logout(userId, accessToken, refreshToken);
  }
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.passwordService.forgotPassword(forgotPasswordDto);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
   return this.passwordService.resetPassword(resetPasswordDto);
  }

  async verifyAccount(verifyAccountDto: VerifyAccountDto): Promise<{ message: string }> {
     return this.verificationService.verifyAccount(verifyAccountDto);
  }

    async validateUser(identifier: string, password: string): Promise<User | null> {

    const user = await this.usersService.findByEmailOrPhone(identifier);

    if (!user) {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      const userCompareResult = await user.comparePassword(password);
      return userCompareResult ? user : null;
    }

    return user;
  }

}