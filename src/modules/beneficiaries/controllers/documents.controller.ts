// src/modules/beneficiaries/controllers/documents.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { BeneficiaryDocumentsService } from '../services/beneficiary-documents.service';
import { UploadDocumentDto, VerifyDocumentDto } from '../dto/upload-document.dto';
import { DocumentType, UserType } from '../../../config/constants';
import type { PaginationParams } from '../../../shared/interfaces/pagination.interface';

@ApiTags('beneficiaries')
@Controller('beneficiaries/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: BeneficiaryDocumentsService) {}

  @Post('upload')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload document (beneficiary or admin)' })
  async uploadDocument(
    @Req() req,
    @Body() uploadDocumentDto: UploadDocumentDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    // Get beneficiary ID from token (for beneficiary) or request
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    
    return this.documentsService.uploadDocument(
      beneficiary.id,
      uploadDocumentDto,
      req.user.id,
      req.user.userType as UserType,
      file
    );
  }

  @Get()
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get beneficiary documents' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getDocuments(
    @Req() req,
    @Query() paginationParams: PaginationParams
  ) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.documentsService.getBeneficiaryDocuments(beneficiary.id, paginationParams);
  }

  @Get('type/:documentType')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get documents by type' })
  async getDocumentsByType(
    @Req() req,
    @Param('documentType') documentType: DocumentType,
    @Query() paginationParams: PaginationParams
  ) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.documentsService.getDocumentsByType(beneficiary.id, documentType, paginationParams);
  }

  @Put(':id/verify')
  @Roles(UserType.ADMIN)
  @ApiOperation({ summary: 'Verify document (admin only)' })
  async verifyDocument(
    @Param('id') id: string,
    @Body() verifyDto: VerifyDocumentDto,
    @Req() req
  ) {
    return this.documentsService.verifyDocument(id, req.user.id, verifyDto);
  }

  @Delete(':id')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete document' })
  async deleteDocument(@Param('id') id: string) {
    await this.documentsService.deleteDocument(id);
  }

  @Get('stats')
  @Roles(UserType.BENEFICIARY, UserType.ADMIN)
  @ApiOperation({ summary: 'Get document statistics' })
  async getDocumentStats(@Req() req) {
    const beneficiary = await this.getBeneficiaryFromRequest(req);
    return this.documentsService.getDocumentStats(beneficiary.id);
  }

  private async getBeneficiaryFromRequest(req: any) {
    // If admin is accessing, they should provide beneficiaryId in query
    if (req.user.userType === UserType.ADMIN && req.query.beneficiaryId) {
      // Logic to get beneficiary by ID
    }
    
    // For beneficiary users, get their own beneficiary profile
    const beneficiaryService = req.app.get('BeneficiariesService');
    return beneficiaryService.findBeneficiaryByUserId(req.user.id);
  }
}

// src/modules/beneficiaries/controllers/documents.controller.ts
// import {
//   Controller,
//   Get,
//   Post,
//   Put,
//   Delete,
//   Body,
//   Param,
//   Query,
//   UseGuards,
//   Req,
//   UseInterceptors,
//   UploadedFile,
//   UploadedFiles,
//   HttpStatus,
//   HttpCode,
//   BadRequestException,
// } from '@nestjs/common';
// import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
// import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiQuery, ApiBody } from '@nestjs/swagger';
// import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
// import { RolesGuard } from '../../../common/guards/roles.guard';
// import { Roles } from '../../../common/decorators/roles.decorator';
// import { BeneficiariesService } from '../services/beneficiaries.service';
// import { BeneficiaryDocumentsService } from '../services/beneficiary-documents.service';
// import { UploadDocumentDto, VerifyDocumentDto } from '../dto/upload-document.dto';
// import { DocumentType, UserType } from '../../../config/constants';
// import type { PaginationParams } from '../../../shared/interfaces/pagination.interface';

// @ApiTags('beneficiaries')
// @Controller('beneficiaries/documents')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @ApiBearerAuth()
// export class DocumentsController {
//   constructor(
//     private readonly documentsService: BeneficiaryDocumentsService,
//     private readonly beneficiariesService: BeneficiariesService,
//   ) {}

//   @Post('upload')
//   @Roles(UserType.BENEFICIARY, UserType.ADMIN)
//   @ApiConsumes('multipart/form-data')
//   @UseInterceptors(FilesInterceptor('files', 5, {
//     limits: {
//       fileSize: 50 * 1024 * 1024, // 50MB per file
//     },
//     fileFilter: (req, file, cb) => {
//       const isImage = file.mimetype.startsWith('image/');
//       const isPdf = file.mimetype === 'application/pdf';
//       const allowedDocs = [
//         'application/msword',
//         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//       ];

//       if (!isImage && !isPdf && !allowedDocs.includes(file.mimetype)) {
//         return cb(
//           new BadRequestException(
//             'Only image, PDF, and Word documents are allowed'
//           ),
//           false,
//         );
//       }

//       // Image max = 10MB
//       if (isImage && file.size > 10 * 1024 * 1024) {
//         return cb(
//           new BadRequestException('Image size must not exceed 10MB'),
//           false,
//         );
//       }

//       // PDF max = 50MB
//       if (isPdf && file.size > 50 * 1024 * 1024) {
//         return cb(
//           new BadRequestException('PDF size must not exceed 50MB'),
//           false,
//         );
//       }

//       // Word docs max = 50MB
//       if (allowedDocs.includes(file.mimetype) && file.size > 50 * 1024 * 1024) {
//         return cb(
//           new BadRequestException('Document size must not exceed 50MB'),
//           false,
//         );
//       }

//       cb(null, true);
//     },
//   }))
//   @ApiOperation({ summary: 'Upload multiple documents (beneficiary or admin)' })
//   @ApiBody({
//     schema: {
//       type: 'object',
//       properties: {
//         files: {
//           type: 'array',
//           items: {
//             type: 'string',
//             format: 'binary',
//           },
//           description: 'Document files (max 5 files, 10MB images, 50MB PDF/Word)'
//         },
//         documentType: {
//           type: 'string',
//           enum: Object.values(DocumentType),
//           example: DocumentType.ID_CARD,
//           description: 'Type of document'
//         },
//         description: {
//           type: 'string',
//           description: 'Optional description of the document',
//           required: false
//         },
//         beneficiaryId: {
//           type: 'string',
//           description: 'Beneficiary ID (required for admin, optional for beneficiary)',
//           required: false
//         },
//       },
//       required: ['files', 'documentType']
//     },
//   })
//   async uploadDocument(
//     @Req() req,
//     @Body() uploadDocumentDto: UploadDocumentDto,
//     @UploadedFiles() files: Express.Multer.File[]
//   ) {
//     if (!files || files.length === 0) {
//       throw new BadRequestException('No files uploaded');
//     }

//     // Get beneficiary ID
//     let beneficiaryId = uploadDocumentDto.beneficiaryId;
    
//     if (req.user.userType === UserType.BENEFICIARY && !beneficiaryId) {
//       // Get beneficiary's own ID
//       const beneficiary = await this.beneficiariesService.findBeneficiaryByUserId(req.user.id);
//       if (!beneficiary) {
//         throw new BadRequestException('Beneficiary profile not found');
//       }
//       beneficiaryId = beneficiary.id;
//     }

//     if (!beneficiaryId) {
//       throw new BadRequestException('Beneficiary ID is required');
//     }

//     // Upload multiple files
//     const results = [];
//     for (const file of files) {
//       const result = await this.documentsService.uploadDocument(
//         beneficiaryId,
//         {
//           ...uploadDocumentDto,
//           documentType: uploadDocumentDto.documentType,
//           description: uploadDocumentDto.description,
//         },
//         req.user.id,
//         req.user.userType as UserType,
//         file
//       );
//       results.push(result);
//     }

//     return {
//       message: `Successfully uploaded ${files.length} document(s)`,
//       documents: results.map(r => ({
//         id: r.id,
//         documentType: r.documentType,
//         status: r.status,
//         url: r.fileUrl,
//       })),
//     };
//   }

//   @Get()
//   @Roles(UserType.BENEFICIARY, UserType.ADMIN)
//   @ApiOperation({ summary: 'Get beneficiary documents' })
//   @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
//   @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
//   @ApiQuery({ name: 'beneficiaryId', required: false, type: String, description: 'Beneficiary ID (admin only)' })
//   async getDocuments(
//     @Req() req,
//     @Query() paginationParams: PaginationParams,
//     @Query('beneficiaryId') beneficiaryId?: string,
//   ) {
//     const targetBeneficiaryId = await this.resolveBeneficiaryId(req, beneficiaryId);
//     return this.documentsService.getBeneficiaryDocuments(targetBeneficiaryId, paginationParams);
//   }

//   @Get('type/:documentType')
//   @Roles(UserType.BENEFICIARY, UserType.ADMIN)
//   @ApiOperation({ summary: 'Get documents by type' })
//   @ApiQuery({ name: 'page', required: false })
//   @ApiQuery({ name: 'limit', required: false })
//   @ApiQuery({ name: 'beneficiaryId', required: false, type: String, description: 'Beneficiary ID (admin only)' })
//   async getDocumentsByType(
//     @Req() req,
//     @Param('documentType') documentType: DocumentType,
//     @Query() paginationParams: PaginationParams,
//     @Query('beneficiaryId') beneficiaryId?: string,
//   ) {
//     const targetBeneficiaryId = await this.resolveBeneficiaryId(req, beneficiaryId);
//     return this.documentsService.getDocumentsByType(targetBeneficiaryId, documentType, paginationParams);
//   }

//   @Put(':id/verify')
//   @Roles(UserType.ADMIN)
//   @ApiOperation({ summary: 'Verify document (admin only)' })
//   async verifyDocument(
//     @Param('id') id: string,
//     @Body() verifyDto: VerifyDocumentDto,
//     @Req() req
//   ) {
//     return this.documentsService.verifyDocument(id, req.user.id, verifyDto);
//   }

//   @Delete(':id')
//   @Roles(UserType.BENEFICIARY, UserType.ADMIN)
//   @HttpCode(HttpStatus.NO_CONTENT)
//   @ApiOperation({ summary: 'Delete document' })
//   async deleteDocument(@Param('id') id: string) {
//     await this.documentsService.deleteDocument(id);
//   }

//   @Get('stats')
//   @Roles(UserType.BENEFICIARY, UserType.ADMIN)
//   @ApiOperation({ summary: 'Get document statistics' })
//   @ApiQuery({ name: 'beneficiaryId', required: false, type: String, description: 'Beneficiary ID (admin only)' })
//   async getDocumentStats(
//     @Req() req,
//     @Query('beneficiaryId') beneficiaryId?: string,
//   ) {
//     const targetBeneficiaryId = await this.resolveBeneficiaryId(req, beneficiaryId);
//     return this.documentsService.getDocumentStats(targetBeneficiaryId);
//   }

//   private async resolveBeneficiaryId(req: any, beneficiaryId?: string): Promise<string> {
//     // If admin provides beneficiaryId, use it
//     if (req.user.userType === UserType.ADMIN && beneficiaryId) {
//       return beneficiaryId;
//     }
    
//     // For beneficiary users, get their own beneficiary profile
//     if (req.user.userType === UserType.BENEFICIARY) {
//       const beneficiary = await this.beneficiariesService.findBeneficiaryByUserId(req.user.id);
//       if (!beneficiary) {
//         throw new BadRequestException('Beneficiary profile not found');
//       }
//       return beneficiary.id;
//     }
    
//     throw new BadRequestException('Beneficiary ID is required');
//   }
// }