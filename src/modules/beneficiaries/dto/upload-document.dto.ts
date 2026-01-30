import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DocumentType } from '../../../config/constants';

export class UploadDocumentDto {
    @ApiProperty({ enum: DocumentType })
    @IsEnum(DocumentType)
    @IsNotEmpty()
    documentType: DocumentType;

    @ApiProperty({ type: 'string', format: 'binary' })
    file: any;
}
