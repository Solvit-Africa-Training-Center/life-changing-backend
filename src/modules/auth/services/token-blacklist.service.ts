// src/modules/auth/services/token-blacklist.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class TokenBlacklistService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
    const key = `blacklist:${token}`;
    await this.redis.set(key, 'blacklisted', 'EX', expiresInSeconds);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `blacklist:${token}`;
    const result = await this.redis.get(key);
    return result === 'blacklisted';
  }

  async blacklistAllUserTokens(userId: string): Promise<void> {
    const pattern = `user_tokens:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async storeUserToken(userId: string, token: string, expiresInSeconds: number): Promise<void> {
    const key = `user_tokens:${userId}:${token}`;
    await this.redis.set(key, 'active', 'EX', expiresInSeconds);
  }

  async removeUserToken(userId: string, token: string): Promise<void> {
    const key = `user_tokens:${userId}:${token}`;
    await this.redis.del(key);
  }

  async getUserActiveTokens(userId: string): Promise<string[]> {
    const pattern = `user_tokens:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length === 0) {
      return [];
    }
    
    const tokens = keys.map(key => key.split(':')[2]);
    return tokens;
  }
}