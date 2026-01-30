import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeneficiaryDocument } from '../entities/beneficiary-document.entity';
import { CloudinaryService } from '../../../shared/cloudinary/cloudinary.service';
import { BeneficiaryBaseService } from './beneficiary-base.service';
import { DocumentType, DocumentStatus } from '../../../config/constants';

@Injectable()
export class BeneficiaryDocumentService {
    constructor(
        @InjectRepository(BeneficiaryDocument) private readonly documentRepo: Repository<BeneficiaryDocument>,
        private readonly cloudinaryService: CloudinaryService,
        private readonly baseService: BeneficiaryBaseService,
    ) { }

    async uploadDocument(userId: string, type: DocumentType, file: Express.Multer.File) {
        const beneficiary = await this.baseService.findByUserId(userId);
        const uploadResult = await this.cloudinaryService.uploadFile(file, `beneficiaries/${beneficiary.id}`);

        if ('error' in uploadResult) {
            throw new BadRequestException(`Cloudinary upload failed: ${uploadResult.error.message}`);
        }

        return this.documentRepo.save(this.documentRepo.create({
            beneficiary,
            documentType: type,
            fileUrl: uploadResult.secure_url,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            status: DocumentStatus.PENDING,
        }));
    }

    async getDocuments(userId: string) {
        const beneficiary = await this.baseService.findByUserId(userId);
        return this.documentRepo.find({
            where: { beneficiary: { id: beneficiary.id } },
            order: { createdAt: 'DESC' }
        });
    }
}
