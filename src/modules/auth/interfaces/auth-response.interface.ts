import { User } from '../../users/entities/user.entity';
import { Tokens } from './tokens.interface';

export interface AuthResponse {
  user: Omit<User, 'password'>;
  tokens: Tokens;
}

export interface LoginResponse extends AuthResponse {
  requiresVerification?: boolean;
}

export interface RegisterResponse extends AuthResponse {
  verificationRequired: boolean;
}