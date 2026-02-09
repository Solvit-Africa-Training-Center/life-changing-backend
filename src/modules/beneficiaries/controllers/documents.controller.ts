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