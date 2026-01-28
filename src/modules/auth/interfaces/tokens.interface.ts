export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface JwtPayload {
  sub: string; // user id
  email: string;
  phone: string;
  userType: string;
  isVerified: boolean;
  iat?: number;
  exp?: number;
}