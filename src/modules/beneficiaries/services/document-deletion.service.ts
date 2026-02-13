// src/modules/beneficiaries/services/document-deletion.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BeneficiaryDocument } from '../entities/beneficiary-document.entity';
import { CloudinaryService } from '../../../shared/services/cloudinary.service';
import { DocumentValidationService } from './document-validation.service';

@Injectable()
export class DocumentDeletionService {
  constructor(
    @InjectRepository(BeneficiaryDocument)
    private readonly documentsRepository: Repository<BeneficiaryDocument>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly validationService: DocumentValidationService,
  ) { }

  async deleteDocument(documentId: string): Promise<void> {
    const document = await this.validationService.validateDocument(documentId);

     try {
      await this.cloudinaryService.deleteFile(document.publicId);
      console.log(`✅ Deleted ${document.publicId.length} file from Cloudinary`);
    } catch (error) {
      console.error('❌ Error deleting from Cloudinary:', error);
      throw new BadRequestException('Failed to delete files from Cloudinary');
    }

    // Delete from database
    await this.documentsRepository.delete(documentId);
  }

  async deleteMultipleDocuments(documentIds: string[]): Promise<number> {
    if (documentIds.length === 0) {
      return 0;
    }

    const documents = await this.documentsRepository.find({
      where: { id: In(documentIds) },
    });

    if (documents.length === 0) {
      throw new NotFoundException('No documents found');
    }

    // Get all public IDs for deletion
    const publicIds = documents.map(doc => doc.publicId);

    try {
      await this.cloudinaryService.deleteFiles(publicIds);
      console.log(`✅ Deleted ${publicIds.length} files from Cloudinary`);
    } catch (error) {
      console.error('❌ Error deleting from Cloudinary:', error);
      throw new BadRequestException('Failed to delete files from Cloudinary');
    }

    // Delete from database
    const result = await this.documentsRepository.delete(documentIds);
    return result.affected || 0;
  }

  async deleteAllBeneficiaryDocuments(beneficiaryId: string): Promise<number> {
    await this.validationService.validateBeneficiary(beneficiaryId);

    const documents = await this.documentsRepository.find({
      where: { beneficiary: { id: beneficiaryId } },
    });

    if (documents.length === 0) {
      return 0;
    }

    const publicIds = documents.map(doc => doc.publicId);

    try {
      await this.cloudinaryService.deleteFiles(publicIds);
      console.log(`✅ Deleted ${publicIds.length} files from Cloudinary`);
    } catch (error) {
      console.error('❌ Error deleting from Cloudinary:', error);
      throw new BadRequestException('Failed to delete files from Cloudinary');
    }

    const result = await this.documentsRepository.delete({
      beneficiary: { id: beneficiaryId },
    });

    return result.affected || 0;
  }
}