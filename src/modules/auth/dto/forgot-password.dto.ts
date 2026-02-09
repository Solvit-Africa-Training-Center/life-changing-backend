import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class ForgotPasswordDto {
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
}