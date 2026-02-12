// src/modules/beneficiaries/services/document-upload.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeneficiaryDocument } from '../entities/beneficiary-document.entity';
import { CloudinaryService } from '../../../shared/services/cloudinary.service';
import { DocumentType, UserType } from '../../../config/constants';
import { DocumentValidationService } from './document-validation.service';
import { DocumentMimeTypeService } from './document-mimetype.service';

@Injectable()
export class DocumentUploadService {
  constructor(
    @InjectRepository(BeneficiaryDocument)
    private readonly documentsRepository: Repository<BeneficiaryDocument>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly validationService: DocumentValidationService,
    private readonly mimeTypeService: DocumentMimeTypeService,
  ) {}

  async uploadDocument(
    beneficiaryId: string,
    documentType: DocumentType,
    uploadedById: string,
    uploadedByType: UserType,
    file?: Express.Multer.File,
    fileBase64?: string,
  ): Promise<BeneficiaryDocument> {
    // Validate entities
    const beneficiary = await this.validationService.validateBeneficiary(beneficiaryId);
    const uploadedBy = await this.validationService.validateUser(uploadedById);
    
    // Validate that either file or fileBase64 is provided
    if (!file && !fileBase64) {
      throw new BadRequestException('Either file or fileBase64 must be provided');
    }

    // Upload to Cloudinary
    const folder = `beneficiaries/${beneficiaryId}/documents/${documentType}`;
    let uploadResult;

    if (file) {
      uploadResult = await this.cloudinaryService.uploadDocument(
        folder,
        file,
        documentType
      );
    } else {
      // At this point, fileBase64 is guaranteed to be defined
      if (!fileBase64) {
        throw new BadRequestException('fileBase64 is required when file is not provided');
      }
      uploadResult = await this.cloudinaryService.uploadBase64Document(
        fileBase64,
        folder,
        documentType
      );
    }

    // Create document record
    const document = this.documentsRepository.create({
      beneficiary,
      documentType,
      fileUrl: uploadResult.url,
      fileName: file?.originalname || `${documentType}_${Date.now()}`,
      fileSize: uploadResult.bytes,
      mimeType: file?.mimetype || this.mimeTypeService.getMimeTypeFromFormat(uploadResult.format),
      publicId: uploadResult.publicId,
      uploadedBy,
      uploadedByType,
      verified: false,
    });

    return this.documentsRepository.save(document);
  }

  async uploadMultipleDocuments(
    beneficiaryId: string,
    files: Express.Multer.File[],
    documentType: DocumentType,
    uploadedById: string,
    uploadedByType: UserType,
  ): Promise<BeneficiaryDocument[]> {
    // Validate inputs
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file must be provided');
    }

    const beneficiary = await this.validationService.validateBeneficiary(beneficiaryId);
    const uploadedBy = await this.validationService.validateUser(uploadedById);
    
    const folder = `beneficiaries/${beneficiaryId}/documents/${documentType}`;
    const documents: BeneficiaryDocument[] = [];

    // Upload files in sequence to avoid overwhelming Cloudinary
    for (const file of files) {
      try {
        const uploadResult = await this.cloudinaryService.uploadDocument(folder, file, documentType);

        const document = this.documentsRepository.create({
          beneficiary,
          documentType,
          fileUrl: uploadResult.url,
          fileName: file.originalname,
          fileSize: uploadResult.bytes,
          mimeType: file.mimetype,
          publicId: uploadResult.publicId,
          uploadedBy,
          uploadedByType,
          verified: false,
        });

        const savedDocument = await this.documentsRepository.save(document);
        documents.push(savedDocument);
      } catch (error) {
        // Log error and continue with next file, or you might want to throw
        console.error(`Failed to upload file ${file.originalname}:`, error);
        throw new BadRequestException(`Failed to upload file ${file.originalname}: ${error.message}`);
      }
    }

    return documents;
  }

  /**
   * Upload a document with custom public ID (for replacement)
   */
  async uploadDocumentWithPublicId(
    beneficiaryId: string,
    documentType: DocumentType,
    uploadedById: string,
    uploadedByType: UserType,
    publicId: string,
    file: Express.Multer.File,
  ): Promise<BeneficiaryDocument> {
    const beneficiary = await this.validationService.validateBeneficiary(beneficiaryId);
    const uploadedBy = await this.validationService.validateUser(uploadedById);
    
    const folder = `beneficiaries/${beneficiaryId}/documents/${documentType}`;
    
    const uploadResult = await this.cloudinaryService.uploadDocumentWithPublicId(
      folder,
      file,
      publicId,
      documentType
    );

    const document = this.documentsRepository.create({
      beneficiary,
      documentType,
      fileUrl: uploadResult.url,
      fileName: file.originalname,
      fileSize: uploadResult.bytes,
      mimeType: file.mimetype,
      publicId: uploadResult.publicId,
      uploadedBy,
      uploadedByType,
      verified: false,
    });

    return this.documentsRepository.save(document);
  }

  /**
   * Upload a base64 document with validation
   */
  async uploadBase64Document(
    beneficiaryId: string,
    documentType: DocumentType,
    uploadedById: string,
    uploadedByType: UserType,
    fileBase64: string,
    fileName?: string,
  ): Promise<BeneficiaryDocument> {
    // Validate inputs
    if (!fileBase64) {
      throw new BadRequestException('fileBase64 is required');
    }

    const beneficiary = await this.validationService.validateBeneficiary(beneficiaryId);
    const uploadedBy = await this.validationService.validateUser(uploadedById);
    
    const folder = `beneficiaries/${beneficiaryId}/documents/${documentType}`;
    
    const uploadResult = await this.cloudinaryService.uploadBase64Document(
      fileBase64,
      folder,
      documentType
    );

    // Generate filename if not provided
    const generatedFileName = fileName || 
      `${documentType}_${Date.now()}.${uploadResult.format}`;

    const document = this.documentsRepository.create({
      beneficiary,
      documentType,
      fileUrl: uploadResult.url,
      fileName: generatedFileName,
      fileSize: uploadResult.bytes,
      mimeType: this.mimeTypeService.getMimeTypeFromFormat(uploadResult.format),
      publicId: uploadResult.publicId,
      uploadedBy,
      uploadedByType,
      verified: false,
    });

    return this.documentsRepository.save(document);
  }
}