// src/modules/beneficiaries/services/beneficiary-documents.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { BeneficiaryDocument } from '../entities/beneficiary-document.entity';
import { Beneficiary } from '../entities/beneficiary.entity';
import { User } from '../../users/entities/user.entity';
import { Staff } from '../../admin/entities/staff.entity';
import { BaseService } from '../../../shared/services/base.service';
import { PaginationParams, PaginatedResponse } from '../../../shared/interfaces/pagination.interface';
import { UploadDocumentDto, VerifyDocumentDto } from '../dto/upload-document.dto';
import { CloudinaryService } from '../../../shared/services/cloudinary.service';
import { DocumentType, UserType } from '../../../config/constants';

@Injectable()
export class BeneficiaryDocumentsService extends BaseService<BeneficiaryDocument> {
  constructor(
    @InjectRepository(BeneficiaryDocument)
    private documentsRepository: Repository<BeneficiaryDocument>,
    @InjectRepository(Beneficiary)
    private beneficiariesRepository: Repository<Beneficiary>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private cloudinaryService: CloudinaryService,
  ) {
    super(documentsRepository);
  }

  async uploadDocument(
    beneficiaryId: string,
    uploadDocumentDto: UploadDocumentDto,
    uploadedById: string,
    uploadedByType: UserType,
    file?: Express.Multer.File
  ): Promise<BeneficiaryDocument> {
    const beneficiary = await this.beneficiariesRepository.findOne({
      where: { id: beneficiaryId },
    });

    if (!beneficiary) {
      throw new NotFoundException('Beneficiary not found');
    }

    const uploadedBy = await this.usersRepository.findOne({
      where: { id: uploadedById },
    });

    if (!uploadedBy) {
      throw new NotFoundException('User not found');
    }

    let fileUrl: string;
    let fileName: string;
    let fileSize: number;
    let mimeType: string;
    let publicId: string;

    if (file) {
      // Handle file upload via multer
      const uploadResult = await this.cloudinaryService.uploadFile(
        file, 
        `beneficiary_${beneficiaryId}_documents`
      );
      fileUrl = uploadResult.url;
      publicId = uploadResult.publicId;
      fileName = file.originalname;
      fileSize = file.size;
      mimeType = file.mimetype;
    } else if (uploadDocumentDto.fileBase64) {
      // Handle base64 file upload
      const uploadResult = await this.cloudinaryService.uploadBase64File(
        uploadDocumentDto.fileBase64,
        `beneficiary_${beneficiaryId}_documents`
      );
      fileUrl = uploadResult.url;
      publicId = uploadResult.publicId;
      fileName = `${uploadDocumentDto.documentType}_${Date.now()}`;
      fileSize = Buffer.from(uploadDocumentDto.fileBase64, 'base64').length;
      mimeType = 'application/octet-stream'; // Default mime type
    } else {
      throw new BadRequestException('Either file or fileBase64 must be provided');
    }

    const document = this.documentsRepository.create({
      beneficiary,
      documentType: uploadDocumentDto.documentType,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      publicId,
      uploadedBy,
      uploadedByType,
      verified: false,
    });

    return await this.documentsRepository.save(document);
  }

  async getBeneficiaryDocuments(
    beneficiaryId: string,
    paginationParams: PaginationParams
  ): Promise<PaginatedResponse<BeneficiaryDocument>> {
    const where: FindOptionsWhere<BeneficiaryDocument> = { 
      beneficiary: { id: beneficiaryId } 
    };
    return this.paginate(paginationParams, where, [
      'beneficiary', 
      'uploadedBy', 
      'verifiedBy'
    ]);
  }

  async getDocumentsByType(
    beneficiaryId: string,
    documentType: DocumentType,
    paginationParams: PaginationParams
  ): Promise<PaginatedResponse<BeneficiaryDocument>> {
    const where: FindOptionsWhere<BeneficiaryDocument> = {
      beneficiary: { id: beneficiaryId },
      documentType,
    };
    return this.paginate(paginationParams, where, [
      'beneficiary', 
      'uploadedBy'
    ]);
  }

  async verifyDocument(
    documentId: string,
    verifiedById: string,
    verifyDto?: VerifyDocumentDto
  ): Promise<BeneficiaryDocument> {
    const document = await this.findOne(documentId, ['verifiedBy']);
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    document.verified = true;
    document.verifiedAt = new Date();
    document.verifiedBy = { id: verifiedById } as Staff;

    return await this.documentsRepository.save(document);
  }

  async deleteDocument(documentId: string): Promise<void> {
    const document = await this.findOne(documentId);
    
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Delete from Cloudinary
    await this.cloudinaryService.deleteFile(document.publicId);

    await this.documentsRepository.delete(documentId);
  }

  async getDocumentStats(beneficiaryId: string) {
    const stats = await this.documentsRepository
      .createQueryBuilder('document')
      .select('document.documentType, COUNT(*) as count, SUM(CASE WHEN document.verified THEN 1 ELSE 0 END) as verified_count')
      .where('document.beneficiary_id = :beneficiaryId', { beneficiaryId })
      .groupBy('document.documentType')
      .getRawMany();

    return stats;
  }
}