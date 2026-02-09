// src/modules/ussd/dto/ussd-request.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Language, UserType } from 'src/config/constants';

export class UssdRequestDto {
  @ApiProperty({ 
    description: 'Phone number initiating the session',
    example: '0781234567'
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ 
    description: 'USSD session ID',
    example: 'ATUid_1234567890abcdef'
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ 
    description: 'Service code dialed (*123*456#)',
    example: '*384*123#'
  })
  @IsString()
  @IsNotEmpty()
  serviceCode: string;

  @ApiProperty({ 
    description: 'User input (text entered)', 
    required: false,
    example: '1'
  })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({ 
    description: 'Network operator', 
    required: false,
    example: 'MTN'
  })
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

export class UssdResponseDto {
  @ApiProperty({ description: 'USSD response text' })
  response: string;

  @ApiProperty({ description: 'Session status' })
  sessionActive: boolean;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;
}

export class UssdSessionDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiProperty({ description: 'Phone number' })
  phoneNumber: string;

  @ApiProperty({ description: 'User type', enum: UserType, nullable: true })
  userType: UserType | null;

  @ApiProperty({ description: 'Language', enum: Language })
  language: Language;

  @ApiProperty({ description: 'Menu state' })
  menuState: string;

  @ApiProperty({ description: 'Step count' })
  stepCount: number;

  @ApiProperty({ description: 'Is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last interaction' })
  lastInteraction: Date;
}

export class UssdStatsDto {
  @ApiProperty({ description: 'Total sessions' })
  total: number;

  @ApiProperty({ description: 'Active sessions' })
  active: number;

  @ApiProperty({ description: 'Sessions today' })
  today: number;

  @ApiProperty({ description: 'Sessions by user type' })
  byUserType: Record<string, number>;

  @ApiProperty({ description: 'Sessions by language' })
  byLanguage: Record<string, number>;

  @ApiProperty({ description: 'Average session steps' })
  avgSteps: number;

  @ApiProperty({ description: 'Completion rate' })
  completionRate: number;
}