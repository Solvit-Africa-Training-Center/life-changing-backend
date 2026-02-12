// src/modules/beneficiaries/dto/upload-document.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { DocumentType, UserType } from '../../../config/constants';
import { ApiProperty } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({ enum: DocumentType, example: 'id_card' })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType: DocumentType;

  @ApiProperty({ required: false, description: 'Base64 encoded file' })
  @IsOptional()
  @IsString()
  fileBase64?: string;

  @ApiProperty({ required: false, description: 'Optional notes about the document' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class VerifyDocumentDto {
  @ApiProperty({ required: false, example: 'Document verified successfully' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// For multiple file uploads
export class UploadMultipleDocumentsDto {
  @ApiProperty({ enum: DocumentType, example: 'supporting_document' })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType: DocumentType;
}

export class DocumentFilterDto {
  @ApiProperty({ required: false, enum: DocumentType })
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @ApiProperty({ required: false, type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  verified?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;
}