// src/modules/beneficiaries/services/document-query.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { BeneficiaryDocument } from '../entities/beneficiary-document.entity';
import { BaseService } from '../../../shared/services/base.service';
import { PaginationParams, PaginatedResponse } from '../../../shared/interfaces/pagination.interface';
import { DocumentType } from '../../../config/constants';
import { DocumentFilterDto } from '../dto/upload-document.dto';
import { DocumentValidationService } from './document-validation.service';

@Injectable()
export class DocumentQueryService extends BaseService<BeneficiaryDocument> {
  constructor(
    @InjectRepository(BeneficiaryDocument)
    private readonly documentsRepository: Repository<BeneficiaryDocument>,
    private readonly validationService: DocumentValidationService,
  ) {
    super(documentsRepository);
  }

  async getBeneficiaryDocuments(
    beneficiaryId: string,
    paginationParams: PaginationParams,
    filter?: DocumentFilterDto,
  ): Promise<PaginatedResponse<BeneficiaryDocument>> {
    await this.validationService.validateBeneficiary(beneficiaryId);

    const where: FindOptionsWhere<BeneficiaryDocument> = {
      beneficiary: { id: beneficiaryId },
    };

    if (filter) {
      if (filter.documentType) {
        where.documentType = filter.documentType;
      }
      if (filter.verified !== undefined) {
        where.verified = filter.verified;
      }
      if (filter.search) {
        where.fileName = Like(`%${filter.search}%`);
      }
    }

    return this.paginate(paginationParams, where, [
      'beneficiary',
      'uploadedBy',
      'verifiedBy',
    ]);
  }

  async getDocumentById(documentId: string, relations: string[] = []): Promise<BeneficiaryDocument> {
    return this.validationService.validateDocument(documentId, relations);
  }

  async getDocumentStats(beneficiaryId: string): Promise<any> {
    await this.validationService.validateBeneficiary(beneficiaryId);

    const stats = await this.documentsRepository
      .createQueryBuilder('document')
      .select([
        'document.documentType as documentType',
        'COUNT(*) as total',
        'SUM(CASE WHEN document.verified THEN 1 ELSE 0 END) as verified',
        'SUM(CASE WHEN NOT document.verified THEN 1 ELSE 0 END) as pending',
      ])
      .where('document.beneficiary_id = :beneficiaryId', { beneficiaryId })
      .groupBy('document.documentType')
      .getRawMany();

    const total = stats.reduce((acc, curr) => acc + parseInt(curr.total), 0);
    const verified = stats.reduce((acc, curr) => acc + parseInt(curr.verified), 0);
    const pending = stats.reduce((acc, curr) => acc + parseInt(curr.pending), 0);

    return {
      total,
      verified,
      pending,
      byType: stats,
    };
  }

  async getRecentDocuments(beneficiaryId: string, limit: number = 5): Promise<BeneficiaryDocument[]> {
    await this.validationService.validateBeneficiary(beneficiaryId);

    return this.documentsRepository.find({
      where: { beneficiary: { id: beneficiaryId } },
      relations: ['uploadedBy', 'verifiedBy'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}