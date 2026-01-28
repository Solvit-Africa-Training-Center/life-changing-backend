import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class LoginDto {
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

  @ApiProperty({ example: 'Password123!' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ example: 'device123', required: false })
  @IsOptional()
  @IsString()
  deviceId?: string;
}