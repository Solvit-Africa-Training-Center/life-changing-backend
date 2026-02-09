// src/modules/users/dto/activate-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActivateUserDto {
  @ApiProperty({ 
    description: 'Whether to activate or deactivate the user',
    example: true 
  })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ 
    description: 'Reason for activation/deactivation',
    example: 'Documents verified successfully',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}