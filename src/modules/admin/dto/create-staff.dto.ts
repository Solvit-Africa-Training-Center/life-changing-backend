import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class ContactInfoDto {
  @ApiProperty({ example: 'Jane Doe', required: false })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiProperty({ example: '+250788123456', required: false })
  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @ApiProperty({ example: 'Kigali, Rwanda', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}

export class CreateStaffDto {
  @ApiProperty({ example: 'Project Manager', required: false })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({ example: 'Operations', required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ type: ContactInfoDto, required: false })
  @IsOptional()
  @IsObject()
  @Type(() => ContactInfoDto)
  contactInfo?: ContactInfoDto;
}
