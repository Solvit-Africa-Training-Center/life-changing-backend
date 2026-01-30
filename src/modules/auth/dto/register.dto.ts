import { IsEmail, IsString, MinLength, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'John', description: 'First name' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: 'Doe', description: 'Last name' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ example: 'beneficiary@example.com', description: 'Email address' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123', description: 'Password' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ example: '+250780000000', description: 'Phone number' })
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ example: '1995-01-01', description: 'Date of birth' })
    @IsString()
    @IsNotEmpty()
    dateOfBirth: string;

    @ApiProperty({ example: 'Bugesera', description: 'District' })
    @IsString()
    @IsNotEmpty()
    district: string;

    @ApiProperty({ example: 'Retail', description: 'Business Type' })
    @IsString()
    @IsNotEmpty()
    businessType: string;

    @ApiProperty({ example: 50000, description: 'Start Capital' })
    @IsNumber()
    startCapital: number;
}
