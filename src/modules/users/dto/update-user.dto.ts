import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { UserType, Language } from '../../../config/constants';

export class UpdateUserDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+250788123456', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^(\+250|250|0)[78]\d{8}$/, {
    message: 'Phone number must be a valid Rwanda number',
  })
  phone?: string;

  @ApiProperty({ enum: UserType, required: false })
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @ApiProperty({ enum: Language, required: false })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isVerified?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isActive?: boolean;
}