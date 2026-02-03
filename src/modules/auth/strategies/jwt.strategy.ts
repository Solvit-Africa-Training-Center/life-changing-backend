import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const secret = configService.get<string>('config.jwt.secret');

    if (!secret) {
      throw new Error('JWT access secret is not configured');
    }

    super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: secret,
    });
  }

  async validate(payload: any): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    return user;
  }
  // async validate(req: any, payload: any): Promise<User> {
  //    // Store the token in request for logout
  //   const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  //   req.jwtToken = token;
    
  //   const user = await this.usersService.findById(payload.sub);
    
  //   if (!user) {
  //     throw new UnauthorizedException('User not found');
  //   }

  //   if (!user.isActive) {
  //     throw new UnauthorizedException('User account is deactivated');
  //   }

  //   return user;
  // }
}