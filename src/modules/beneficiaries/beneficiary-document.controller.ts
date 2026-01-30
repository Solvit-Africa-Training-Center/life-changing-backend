import { Controller, Get, Post, Body, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BeneficiaryDocumentService } from './services/beneficiary-document.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

@ApiTags('beneficiaries')
@ApiBearerAuth()
@Controller('beneficiaries')
@UseGuards(JwtAuthGuard)
export class BeneficiaryDocumentController {
    constructor(private readonly documentService: BeneficiaryDocumentService) { }

    @Post('documents')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload a document' })
    @ApiConsumes('multipart/form-data')
    async uploadDocument(@Req() req, @Body() dto: UploadDocumentDto, @UploadedFile() file: Express.Multer.File) {
        return this.documentService.uploadDocument(req.user.id, dto.documentType, file);
    }

    @Get('documents')
    @ApiOperation({ summary: 'Get my documents' })
    async getMyDocuments(@Req() req) {
        return this.documentService.getDocuments(req.user.id);
    }
}
