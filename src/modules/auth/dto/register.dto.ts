import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { UserType, Language } from '../../../config/constants';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+250788123456' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(\+250|250|0)[78]\d{8}$/, {
    message: 'Phone number must be a valid Rwanda number',
  })
  phone: string;

  @ApiProperty({ example: 'Password123!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/, {
    message: 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character',
  })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

   @ApiProperty({ 
    enum: UserType, 
    example: UserType.BENEFICIARY,
    required: false,
    default: UserType.BENEFICIARY
  })
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @ApiProperty({ enum: Language, example: Language.EN, required: false })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ApiProperty({ example: 'device123', required: false })
  @IsOptional()
  @IsString()
  deviceId?: string;
}