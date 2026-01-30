import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'beneficiary@example.com', description: 'The email of the beneficiary' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123', description: 'The password of the beneficiary' })
    @IsString()
    @MinLength(6)
    password: string;
}
