// src/modules/beneficiaries/services/document-verification.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeneficiaryDocument } from '../entities/beneficiary-document.entity';
import { Staff } from '../../admin/entities/staff.entity';
import { DocumentValidationService } from './document-validation.service';
import { VerifyDocumentDto } from '../dto/upload-document.dto';

@Injectable()
export class DocumentVerificationService {
  constructor(
    @InjectRepository(BeneficiaryDocument)
    private readonly documentsRepository: Repository<BeneficiaryDocument>,
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
    private readonly validationService: DocumentValidationService,
  ) {}

  async verifyDocument(
    documentId: string,
    verifiedById: string,
    verifyDto?: VerifyDocumentDto,
  ): Promise<BeneficiaryDocument> {
    const document = await this.validationService.validateDocument(documentId, ['verifiedBy']);

     let staff = await this.staffRepository.findOne({
      where: { user: { id: verifiedById } },
      relations: ['user'],
    });

    if (!staff) {
       throw new BadRequestException('Admin not foud');
    }

    document.verified = true;
    document.verifiedAt = new Date();
    document.verifiedBy = staff;

    return this.documentsRepository.save(document);
  }

  async unverifyDocument(documentId: string): Promise<BeneficiaryDocument> {
    const document = await this.validationService.validateDocument(documentId);

    document.verified = false;
    document.verifiedAt = null;
    document.verifiedBy = null;

    return this.documentsRepository.save(document);
  }

  async bulkVerifyDocuments(documentIds: string[], verifiedById: string): Promise<number> {

    let staff = await this.staffRepository.findOne({
      where: { user: { id: verifiedById } },
      relations: ['user'],
    });

    if (!staff) {
       throw new BadRequestException('Admin not foud');
    }

    const result = await this.documentsRepository
      .createQueryBuilder()
      .update(BeneficiaryDocument)
      .set({
        verified: true,
        verifiedAt: new Date(),
        verifiedBy: staff,
      })
      .whereInIds(documentIds)
      .execute();

    return result.affected || 0;
  }
}