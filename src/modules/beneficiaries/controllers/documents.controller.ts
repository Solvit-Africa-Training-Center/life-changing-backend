// src/modules/beneficiaries/controllers/documents.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiConsumes, 
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { BeneficiaryDocumentsService } from '../services/beneficiary-documents.service';
import { 
  UploadDocumentDto, 
  VerifyDocumentDto, 
  UploadMultipleDocumentsDto,
  DocumentFilterDto,
} from '../dto/upload-document.dto';
import { DocumentType, UserType } from '../../../config/constants';
import type { PaginationParams } from '../../../shared/interfaces/pagination.interface';

@ApiTags('beneficiary-documents')
@Controller('beneficiaries/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: BeneficiaryDocumentsService) {}

  // ================= SINGLE DOCUMENT UPLOAD =================
  @Post('upload')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              `File type ${file.mimetype} not allowed. Allowed types: JPEG, PNG, WebP, PDF, DOC, DOCX`
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Upload a single document (beneficiary or admin)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file (max 20MB)',
        },
        documentType: {
          type: 'string',
          enum: Object.values(DocumentType),
          example: 'id_card',
        },
        notes: {
          type: 'string',
          description: 'Optional notes about the document',
        },
      },
      required: ['file', 'documentType'],
    },
  })
  async uploadDocument(
    @Req() req,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.documentsService.uploadDocument(
      beneficiary.id,
      uploadDocumentDto,
      req.user.id,
      req.user.userType as UserType,
      file,
    );
  }

  // ================= MULTIPLE DOCUMENTS UPLOAD =================
  @Post('upload/multiple')
  @Roles(UserType.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'application/pdf',
        ];
        if (!allowedMimes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              `File type ${file.mimetype} not allowed for bulk upload`
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Upload multiple documents at once (admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        documentType: {
          type: 'string',
          enum: Object.values(DocumentType),
          example: 'supporting_document',
        },
        beneficiaryId: {
          type: 'string',
          description: 'Required for admin uploads',
        },
      },
      required: ['files', 'documentType', 'beneficiaryId'],
    },
  })
  async uploadMultipleDocuments(
    @Req() req,
    @Body() body: UploadMultipleDocumentsDto & { beneficiaryId?: string },
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    let beneficiaryId: string;

    if (req.user.userType === UserType.ADMIN && body.beneficiaryId) {
      beneficiaryId = body.beneficiaryId;
    } else {
      const beneficiary = await this.getBeneficiaryFromRequest(req);
      beneficiaryId = beneficiary.id;
    }

    const documents = await this.documentsService.uploadMultipleDocuments(
      beneficiaryId,
      files,
      body.documentType,
      req.user.id,
      req.user.userType as UserType,
    );

    return {
      message: `Successfully uploaded ${documents.length} document(s)`,
      documents,
    };
  }

  // ================= GET DOCUMENTS =================
  @Get()
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get beneficiary documents with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'documentType', required: false, enum: DocumentType })
  @ApiQuery({ name: 'verified', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getDocuments(
    @Req() req,
    @Query() paginationParams: PaginationParams,
    @Query() filter: DocumentFilterDto,
  ) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.documentsService.getBeneficiaryDocuments(
      beneficiary.id,
      paginationParams,
      filter,
    );
  }

  // ================= GET DOCUMENT BY ID =================
  @Get(':id')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get document by ID' })
  async getDocumentById(
    @Req() req,
    @Param('id') id: string,
  ) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.documentsService.validateDocumentBelongsToBeneficiary(id, beneficiary.id);
  }

  // ================= GET DOCUMENT STATISTICS =================
  @Get('stats/summary')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get document statistics' })
  async getDocumentStats(@Req() req) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.documentsService.getDocumentStats(beneficiary.id);
  }

  // ================= GET RECENT DOCUMENTS =================
  @Get('recent/list')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get recent documents' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentDocuments(
    @Req() req,
    @Query('limit') limit?: number,
  ) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.documentsService.getRecentDocuments(beneficiary.id, limit);
  }

  // ================= VERIFY DOCUMENT =================
  @Patch(':id/verify')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Verify document (admin only)' })
  async verifyDocument(
    @Param('id') id: string,
    @Body() verifyDto: VerifyDocumentDto,
    @Req() req,
  ) {
    return this.documentsService.verifyDocument(id, req.user.id, verifyDto);
  }

  // ================= UNVERIFY DOCUMENT =================
  @Patch(':id/unverify')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Unverify document (admin only)' })
  async unverifyDocument(@Param('id') id: string) {
    return this.documentsService.unverifyDocument(id);
  }

  // ================= BULK VERIFY DOCUMENTS =================
  @Post('verify/bulk')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Bulk verify documents (admin only)' })
  async bulkVerifyDocuments(
    @Body() body: { documentIds: string[] },
    @Req() req,
  ) {
    const count = await this.documentsService.bulkVerifyDocuments(
      body.documentIds,
      req.user.id,
    );
    return { message: `Successfully verified ${count} document(s)` };
  }

  // ================= DELETE DOCUMENT =================
  @Delete(':id')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a single document' })
  async deleteDocument(@Param('id') id: string) {
    await this.documentsService.deleteDocument(id);
  }

  // ================= BULK DELETE DOCUMENTS =================
  @Delete('bulk/delete')
  @Roles(UserType.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bulk delete documents (admin only)' })
  async deleteMultipleDocuments(@Body() body: { documentIds: string[] }) {
    const count = await this.documentsService.deleteMultipleDocuments(body.documentIds);
    return { message: `Successfully deleted ${count} document(s)` };
  }

  // ================= DELETE ALL BENEFICIARY DOCUMENTS =================
  @Delete('beneficiary/all')
  @Roles(UserType.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete all documents for a beneficiary (admin only)' })
  async deleteAllBeneficiaryDocuments(@Query('beneficiaryId') beneficiaryId: string) {
    const count = await this.documentsService.deleteAllBeneficiaryDocuments(beneficiaryId);
    return { message: `Successfully deleted ${count} document(s)` };
  }

  // ================= HELPER METHOD =================
  private async getBeneficiaryFromRequest(req: any): Promise<any> {
    if (req.user.userType === UserType.ADMIN && req.query.beneficiaryId) {
      const beneficiary = await this.documentsService.validateBeneficiary(
        req.query.beneficiaryId,
      );
      return beneficiary;
    }

    if (req.user.userType === UserType.BENEFICIARY) {
      // Get beneficiary service from app context
      const beneficiariesService = req.app.get('BeneficiariesService');
      return beneficiariesService.findBeneficiaryByUserId(req.user.id);
    }

    throw new BadRequestException('Unable to determine beneficiary');
  }
}