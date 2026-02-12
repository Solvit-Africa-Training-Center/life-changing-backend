// src/modules/beneficiaries/services/beneficiary-documents.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeneficiaryDocument } from '../entities/beneficiary-document.entity';
import { PaginationParams, PaginatedResponse } from '../../../shared/interfaces/pagination.interface';
import { UploadDocumentDto, VerifyDocumentDto, DocumentFilterDto } from '../dto/upload-document.dto';
import { DocumentType, UserType } from '../../../config/constants';

import { DocumentValidationService } from './document-validation.service';
import { DocumentUploadService } from './document-upload.service';
import { DocumentVerificationService } from './document-verification.service';
import { DocumentDeletionService } from './document-deletion.service';
import { DocumentQueryService } from './document-query.service';

@Injectable()
export class BeneficiaryDocumentsService {
  constructor(
    @InjectRepository(BeneficiaryDocument)
    private readonly documentsRepository: Repository<BeneficiaryDocument>,
    private readonly validationService: DocumentValidationService,
    private readonly uploadService: DocumentUploadService,
    private readonly verificationService: DocumentVerificationService,
    private readonly deletionService: DocumentDeletionService,
    private readonly queryService: DocumentQueryService,
  ) {}

  // ================= UPLOAD OPERATIONS =================
  async uploadDocument(
    beneficiaryId: string,
    dto: UploadDocumentDto,
    uploadedById: string,
    uploadedByType: UserType,
    file?: Express.Multer.File,
  ): Promise<BeneficiaryDocument> {
    return this.uploadService.uploadDocument(
      beneficiaryId,
      dto.documentType,
      uploadedById,
      uploadedByType,
      file,
      dto.fileBase64,
    );
  }

  async uploadMultipleDocuments(
    beneficiaryId: string,
    files: Express.Multer.File[],
    documentType: DocumentType,
    uploadedById: string,
    uploadedByType: UserType,
  ): Promise<BeneficiaryDocument[]> {
    return this.uploadService.uploadMultipleDocuments(
      beneficiaryId,
      files,
      documentType,
      uploadedById,
      uploadedByType,
    );
  }

  // ================= VERIFICATION OPERATIONS =================
  async verifyDocument(
    documentId: string,
    verifiedById: string,
    verifyDto?: VerifyDocumentDto,
  ): Promise<BeneficiaryDocument> {
    return this.verificationService.verifyDocument(documentId, verifiedById, verifyDto);
  }

  async unverifyDocument(documentId: string): Promise<BeneficiaryDocument> {
    return this.verificationService.unverifyDocument(documentId);
  }

  async bulkVerifyDocuments(documentIds: string[], verifiedById: string): Promise<number> {
    return this.verificationService.bulkVerifyDocuments(documentIds, verifiedById);
  }

  // ================= DELETION OPERATIONS =================
  async deleteDocument(documentId: string): Promise<void> {
    return this.deletionService.deleteDocument(documentId);
  }

  async deleteMultipleDocuments(documentIds: string[]): Promise<number> {
    return this.deletionService.deleteMultipleDocuments(documentIds);
  }

  async deleteAllBeneficiaryDocuments(beneficiaryId: string): Promise<number> {
    return this.deletionService.deleteAllBeneficiaryDocuments(beneficiaryId);
  }

  // ================= QUERY OPERATIONS =================
  async getBeneficiaryDocuments(
    beneficiaryId: string,
    paginationParams: PaginationParams,
    filter?: DocumentFilterDto,
  ): Promise<PaginatedResponse<BeneficiaryDocument>> {
    return this.queryService.getBeneficiaryDocuments(beneficiaryId, paginationParams, filter);
  }

  async getDocumentById(documentId: string, relations: string[] = []): Promise<BeneficiaryDocument> {
    return this.queryService.getDocumentById(documentId, relations);
  }

  async getDocumentStats(beneficiaryId: string): Promise<any> {
    return this.queryService.getDocumentStats(beneficiaryId);
  }

  async getRecentDocuments(beneficiaryId: string, limit?: number): Promise<BeneficiaryDocument[]> {
    return this.queryService.getRecentDocuments(beneficiaryId, limit);
  }

  // ================= VALIDATION HELPERS =================
  async validateDocumentBelongsToBeneficiary(
    documentId: string,
    beneficiaryId: string,
  ): Promise<BeneficiaryDocument> {
    return this.validationService.validateDocumentBelongsToBeneficiary(documentId, beneficiaryId);
  }

  async validateBeneficiary(beneficiaryId: string): Promise<any> {
    return this.validationService.validateBeneficiary(beneficiaryId);
  }
}