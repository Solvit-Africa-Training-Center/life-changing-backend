import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsBoolean, IsOptional, IsArray, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { StaffRole } from '../../../config/constants';

export class ContactInfoDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  emergencyContact: string;

  @ApiProperty({ example: '+250788123456' })
  @IsString()
  emergencyPhone: string;

  @ApiProperty({ example: 'Kigali, Rwanda' })
  @IsString()
  address: string;
}

export class CreateStaffDto {
  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  fullName: string;

  @ApiProperty({ enum: StaffRole, example: StaffRole.ADMIN })
  @IsEnum(StaffRole)
  role: StaffRole;

  @ApiProperty({ example: 'Program Management', required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ example: ['*'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiProperty({ example: 'EMP001', required: false })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsOptional()
  @IsString()
  hireDate?: string;

  @ApiProperty({ type: ContactInfoDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ContactInfoDto)
  contactInfo?: ContactInfoDto;
}

