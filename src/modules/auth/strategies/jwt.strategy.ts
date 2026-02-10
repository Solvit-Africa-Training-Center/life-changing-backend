import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/services/users.service';
import { User } from '../../users/entities/user.entity';
import { TokenBlacklistService } from '../services/token-blacklist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private tokenBlacklistService: TokenBlacklistService,
  ) {
    const secret = configService.get<string>('config.jwt.secret');

    if (!secret) {
      throw new Error('JWT access secret is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any): Promise<User> { 
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    // Check if token is blacklisted
    const isBlacklisted = await this.tokenBlacklistService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been invalidated (logged out)');
    }

    const user = await this.usersService.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    return user;
  }
}