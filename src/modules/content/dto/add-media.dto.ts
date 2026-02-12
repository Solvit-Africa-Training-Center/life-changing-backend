// src/modules/content/dto/add-media.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export class AddMediaDto {
  @ApiProperty({ required: false, example: 'Marie receiving her certificate' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({ enum: ['image', 'video'], example: 'image' })
  @IsEnum(['image', 'video'])
  type: 'image' | 'video';
}