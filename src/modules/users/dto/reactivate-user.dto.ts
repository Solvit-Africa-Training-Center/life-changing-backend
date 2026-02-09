// src/modules/users/dto/reactivate-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReactivateUserDto {
  @ApiProperty({ 
    description: 'Reason for reactivation',
    example: 'Issue resolved after review',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}