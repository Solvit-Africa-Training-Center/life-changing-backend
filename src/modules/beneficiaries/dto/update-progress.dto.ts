// src/modules/beneficiaries/dto/update-progress.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class UpdateProgressDto {
  @ApiProperty({ 
    example: 45000,
    description: 'Current progress amount',
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  progress: number;
}