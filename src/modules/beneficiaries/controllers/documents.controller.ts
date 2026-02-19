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
  NotFoundException,
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
import { BeneficiaryServiceInterceptor } from 'src/common/interceptors/beneficiary-service.interceptor';
import { CurrentBeneficiary } from 'src/common/decorators/current-beneficiary.decorator';
import { Beneficiary } from '../entities/beneficiary.entity';

@ApiTags('beneficiary-documents')
@Controller('beneficiaries/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@UseInterceptors(BeneficiaryServiceInterceptor)
export class DocumentsController {
  constructor(private readonly documentsService: BeneficiaryDocumentsService) { }

  // ================= HELPER METHOD TO GET BENEFICIARY ID =================
  private async getBeneficiaryId(
    req: any,
    beneficiaryFromDecorator: Beneficiary | null,
    queryBeneficiaryId?: string,
  ): Promise<string> {
    // If user is admin
    if (req.user.userType === UserType.ADMIN) {
      if (!queryBeneficiaryId) {
        throw new BadRequestException('beneficiaryId is required as a query parameter for admin users');
      }
      return queryBeneficiaryId;
    }

    // If user is beneficiary
    if (req.user.userType === UserType.BENEFICIARY) {
      if (!beneficiaryFromDecorator) {
        throw new NotFoundException('Beneficiary profile not found');
      }
      return beneficiaryFromDecorator.id;
    }

    throw new BadRequestException('Invalid user type');
  }
  // ================= SINGLE DOCUMENT UPLOAD =================
  @Post('upload')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          // Images
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'image/gif',

          // PDF
          'application/pdf',

          // Microsoft Word
          'application/msword', // .doc
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/vnd.ms-word.document.macroenabled.12',
          'application/vnd.ms-word.template.macroenabled.12',

          // OpenDocument Text (optional - if you want to include)
          'application/vnd.oasis.opendocument.text', // .odt
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
  @ApiQuery({
    name: 'beneficiaryId',
    required: false,
    type: String,
    description: 'Required for admin users'
  })
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
          example: DocumentType.ID_CARD,
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
    @CurrentBeneficiary() beneficiary: Beneficiary,
    @Req() req,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
    @Query('beneficiaryId') queryBeneficiaryId?: string,

  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const beneficiaryId = await this.getBeneficiaryId(
      req,
      beneficiary,
      queryBeneficiaryId
    );

    return this.documentsService.uploadDocument(
      beneficiaryId,
      uploadDocumentDto,
      req.user.id,
      req.user.userType as UserType,
      file,
    );
  }

  // ================= MULTIPLE DOCUMENTS UPLOAD =================
  @Post('upload/multiple')
  @Roles(UserType.BENEFICIARY,UserType.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          // Images
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp', 
          'image/gif',
 
          // PDF
          'application/pdf',

          // Microsoft Word
          'application/msword', // .doc
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/vnd.ms-word.document.macroenabled.12',
          'application/vnd.ms-word.template.macroenabled.12',

          // OpenDocument Text (optional - if you want to include)
          'application/vnd.oasis.opendocument.text', // .odt
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
  @ApiQuery({
    name: 'beneficiaryId',
    required: false,
    type: String,
    description: 'Required for admin users'
  })
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
          example: DocumentType.ID_CARD,
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
    @CurrentBeneficiary() beneficiary: Beneficiary,
    @Req() req,
    @Body() body: UploadMultipleDocumentsDto & { beneficiaryId?: string },
    @UploadedFiles() files: Express.Multer.File[],
    @Query('beneficiaryId') queryBeneficiaryId?: string,

  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const beneficiaryId = await this.getBeneficiaryId(
      req,
      beneficiary,
      queryBeneficiaryId
    );

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
  @ApiQuery({
    name: 'beneficiaryId',
    required: false,
    type: String,
    description: 'Required for admin users'
  })
  async getDocuments(
    @CurrentBeneficiary() beneficiary: Beneficiary,
    @Req() req,
    @Query() paginationParams: PaginationParams,
    @Query() filter: DocumentFilterDto,
    @Query('beneficiaryId') queryBeneficiaryId?: string,

  ) {
    const beneficiaryId = await this.getBeneficiaryId(
      req,
      beneficiary,
      queryBeneficiaryId
    );

    return this.documentsService.getBeneficiaryDocuments(
      beneficiaryId,
      paginationParams,
      filter,
    );
  }

  // ================= GET DOCUMENT BY ID =================
  @Get(':id')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiQuery({
    name: 'beneficiaryId',
    required: false,
    type: String,
    description: 'Required for admin users'
  })
  async getDocumentById(
    @CurrentBeneficiary() beneficiary: Beneficiary,
    @Req() req,
    @Param('id') id: string,
    @Query('beneficiaryId') queryBeneficiaryId?: string,
  ) {

    const beneficiaryId = await this.getBeneficiaryId(
      req,
      beneficiary,
      queryBeneficiaryId
    );

    return this.documentsService.validateDocumentBelongsToBeneficiary(id, beneficiaryId);
  }

  // ================= GET DOCUMENT STATISTICS =================
  @Get('stats/summary')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get document statistics' })
  @ApiQuery({
    name: 'beneficiaryId',
    required: false,
    type: String,
    description: 'Required for admin users'
  })
  async getDocumentStats(
    @CurrentBeneficiary() beneficiary: Beneficiary,
    @Req() req,
    @Query('beneficiaryId') queryBeneficiaryId?: string,
  ) {
    const beneficiaryId = await this.getBeneficiaryId(
      req,
      beneficiary,
      queryBeneficiaryId
    );
    return this.documentsService.getDocumentStats(beneficiaryId);
  }

  // ================= GET RECENT DOCUMENTS =================
  @Get('recent/list')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get recent documents' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'beneficiaryId',
    required: false,
    type: String,
    description: 'Required for admin users'
  })
  async getRecentDocuments(
    @CurrentBeneficiary() beneficiary: Beneficiary,
    @Req() req,
    @Query('limit') limit?: number,
    @Query('beneficiaryId') queryBeneficiaryId?: string,
  ) {
    const beneficiaryId = await this.getBeneficiaryId(
      req,
      beneficiary,
      queryBeneficiaryId
    );
    return this.documentsService.getRecentDocuments(beneficiaryId, limit);
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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        documentIds: {
          type: 'array',
          items: {
            type: 'string',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          example: [
            '123e4567-e89b-12d3-a456-426614174000',
            '223e4567-e89b-12d3-a456-426614174001',
            '323e4567-e89b-12d3-a456-426614174002'
          ],
          description: 'Array of document IDs to verify'
        }
      },
      required: ['documentIds']
    }
  })
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
  @ApiQuery({
    name: 'beneficiaryId',
    required: true,
    type: String,
    description: 'Beneficiary ID'
  })
  async deleteDocument(@Query('beneficiaryId') beneficiaryId: string) {
    await this.documentsService.deleteDocument(beneficiaryId);
  }

  // ================= BULK DELETE DOCUMENTS =================
  @Delete('bulk/delete')
  @Roles(UserType.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bulk delete documents (admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        documentIds: {
          type: 'array',
          items: {
            type: 'string',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          example: [
            '123e4567-e89b-12d3-a456-426614174000',
            '223e4567-e89b-12d3-a456-426614174001',
            '323e4567-e89b-12d3-a456-426614174002'
          ],
          description: 'Array of document IDs to delete'
        }
      },
      required: ['documentIds']
    }
  })
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

  // ================= ADMIN ENDPOINT WITH QUERY PARAM =================

  @Get('admin/beneficiary/:beneficiaryId')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Get documents by beneficiary ID (admin only)' })
  async getDocumentsByBeneficiaryId(
    @Param('beneficiaryId') beneficiaryId: string,
    @Query() paginationParams: PaginationParams,
    @Query() filter: DocumentFilterDto,
  ) {
    return this.documentsService.getBeneficiaryDocuments(
      beneficiaryId,
      paginationParams,
      filter,
    );
  }
}