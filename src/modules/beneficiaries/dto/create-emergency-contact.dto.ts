// src/modules/beneficiaries/dto/create-emergency-contact.dto.ts
import { IsNotEmpty, IsOptional, IsString, IsBoolean, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmergencyContactDto {
  @ApiProperty({example :'John'})
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({example:'friend'})
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @ApiProperty({ example: '+250788123456' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(\+250|250|0)[78]\d{8}$/, {
    message: 'Phone number must be a valid Rwanda number',
  })
  phone: string;


  @ApiProperty({ example: '+250788123457', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^(\+250|250|0)[78]\d{8}$/, {
    message: 'Phone number must be a valid Rwanda number',
  })
  alternatePhone?: string;

  @ApiProperty({example:'Kigali'})
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateEmergencyContactDto extends CreateEmergencyContactDto { }