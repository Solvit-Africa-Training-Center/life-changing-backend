import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserType } from 'src/config/constants';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  generateDevAdminToken() {
    return this.jwtService.sign({
      sub: 'dev-admin-id',
      userType: UserType.ADMIN,
      email: 'admin@lceo.org',
    });
  }
}
