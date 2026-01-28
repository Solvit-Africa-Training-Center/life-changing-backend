// src/modules/ussd/dto/ussd-request.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Language } from 'src/config/constants';


export class UssdRequestDto {
  @ApiProperty({ description: 'Phone number initiating the session' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: 'USSD session ID' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Service code dialed (*123*456#)' })
  @IsString()
  @IsNotEmpty()
  serviceCode: string;

  @ApiProperty({ description: 'User input (text entered)', required: false })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({ description: 'Network operator', required: false })
  @IsString()
  @IsOptional()
  networkCode?: string;

  @ApiProperty({ 
    description: 'User language preference', 
    required: false,
    enum: Language,
    default: Language.EN 
  })
  @IsEnum(Language)
  @IsOptional()
  language?: Language;
}