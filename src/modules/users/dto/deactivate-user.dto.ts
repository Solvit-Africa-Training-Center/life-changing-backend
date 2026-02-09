// src/modules/users/dto/deactivate-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeactivateUserDto {
  @ApiProperty({ 
    description: 'Reason for deactivation',
    example: 'Violation of terms of service',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

