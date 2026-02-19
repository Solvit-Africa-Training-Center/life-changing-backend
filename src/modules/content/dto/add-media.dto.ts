// src/modules/content/dto/add-media.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { BadRequestException } from '@nestjs/common';

export class AddMediaDto {
  @ApiProperty({ required: false, example: 'Marie receiving her certificate' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({ enum: ['image', 'video'], example: 'image' })
  @IsEnum(['image', 'video'])
  type: 'image' | 'video';
}

export class AddMultipleMediaDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string', format: 'binary' },
    description: 'Media files (images/videos)',
    required: false
  })
  media?: any[];

  @ApiProperty({
    type: 'string',
    example: '["image","video"] or image,video',
    description: 'Media types for each file - can be JSON array or comma-separated values',
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        if (value.includes(',')) {
          return value.split(',').map(item => item.trim().toLowerCase());
        }
        return [value.trim().toLowerCase()];
      }
    }
    return Array.isArray(value) ? value : [value];
  })
  mediaTypes?: string[];

  @ApiProperty({
    type: 'string',
    example: '["Marie receiving her certificate","Marie at her business"] or Caption1,Caption2',
    description: 'Captions for each file - can be JSON array or comma-separated values',
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        if (value.includes(',')) {
          return value.split(',').map(item => item.trim());
        }
        return [value.trim()];
      }
    }
    return Array.isArray(value) ? value : [value];
  })
  captions?: string[];
}

export class UpdateMediaCaptionDto {
  @ApiProperty({ example: 'public_id_12345' })
  @IsString()
  publicId: string;

  @ApiProperty({ example: 'Updated caption for this media' })
  @IsString()
  caption: string;
}

export class UpdateMultipleMediaCaptionsDto {
  @ApiProperty({
    type: 'string',
    example: '[{"publicId":"abc123","caption":"Updated caption 1"},{"publicId":"def456","caption":"Updated caption 2"}]',
    description: 'JSON string array of media items to update'
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        throw new BadRequestException('Invalid update items format');
      }
    }
    return value;
  })
  items: UpdateMediaCaptionDto[];
}

export class RemoveMediaDto {
  @ApiProperty({ example: 'public_id_12345' })
  @IsString()
  publicId: string;
}

export class RemoveMultipleMediaDto {
  @ApiProperty({
    type: 'string',
    example: '["publicId1","publicId2"] or publicId1,publicId2',
    description: 'JSON array or comma-separated list of publicIds to remove'
  })
  @Transform(({ value }) => {
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        if (value.includes(',')) {
          return value.split(',').map(item => item.trim());
        }
        return [value.trim()];
      }
    }
    return Array.isArray(value) ? value : [value];
  })
  publicIds: string[];
}