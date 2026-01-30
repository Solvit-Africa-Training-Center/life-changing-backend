import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  CreateDateColumn,
  ManyToOne
} from 'typeorm';
import { Beneficiary } from './beneficiary.entity';
import { Staff } from '../../users/entities/staff.entity';
import { DocumentType, DocumentStatus } from '../../../config/constants';

@Entity('beneficiary_documents')
export class BeneficiaryDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Beneficiary, (beneficiary) => beneficiary.documents)
  @JoinColumn({ name: 'beneficiary_id' })
  beneficiary: Beneficiary;

  @Column({
    name: 'document_type',
    type: 'enum',
    enum: DocumentType,
  })
  documentType: DocumentType;

  @Column({ name: 'file_url' })
  fileUrl: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_size' })
  fileSize: number;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy: Staff;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING,
  })
  status: DocumentStatus;

  @Column({ name: 'rejection_reason', nullable: true })
  rejectionReason: string;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifiedBy: Staff;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}