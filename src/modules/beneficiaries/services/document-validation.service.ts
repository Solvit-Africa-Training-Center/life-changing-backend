// src/modules/beneficiaries/services/document-validation.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeneficiaryDocument } from '../entities/beneficiary-document.entity';
import { Beneficiary } from '../entities/beneficiary.entity';
import { User } from '../../users/entities/user.entity';
import { DocumentType } from 'src/config/constants';

@Injectable()
export class DocumentValidationService {
  constructor(
    @InjectRepository(BeneficiaryDocument)
    private readonly documentsRepository: Repository<BeneficiaryDocument>,
    @InjectRepository(Beneficiary)
    private readonly beneficiariesRepository: Repository<Beneficiary>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async validateBeneficiary(beneficiaryId: string): Promise<Beneficiary> {
    const beneficiary = await this.beneficiariesRepository.findOne({
      where: { id: beneficiaryId },
    });

    if (!beneficiary) {
      throw new NotFoundException(`Beneficiary with ID ${beneficiaryId} not found`);
    }

    return beneficiary;
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }

  async validateDocument(documentId: string, relations: string[] = []): Promise<BeneficiaryDocument> {
    const document = await this.documentsRepository.findOne({
      where: { id: documentId },
      relations,
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    return document;
  }

  async validateDocumentBelongsToBeneficiary(
    documentId: string,
    beneficiaryId: string
  ): Promise<BeneficiaryDocument> {
    const document = await this.documentsRepository.findOne({
      where: {
        id: documentId,
        beneficiary: { id: beneficiaryId },
      },
      relations: ['beneficiary', 'uploadedBy'],
    });

    if (!document) {
      throw new NotFoundException('Document not found or does not belong to this beneficiary');
    }

    return document;
  }

  validateFile(file?: Express.Multer.File, fileBase64?: string): void {
    if (!file && !fileBase64) {
      throw new BadRequestException('Either file or fileBase64 must be provided');
    }
  }

  validateDocumentType(documentType: string): void {
    const validTypes = Object.values(DocumentType);
    if (!validTypes.includes(documentType as DocumentType)) {
      throw new BadRequestException(`Invalid document type. Valid types: ${validTypes.join(', ')}`);
    }
  }
}