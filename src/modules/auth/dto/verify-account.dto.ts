import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyAccountDto {
  @ApiProperty({ example: 'verification_token_123' })
  @IsNotEmpty()
  @IsString()
  token: string;
}