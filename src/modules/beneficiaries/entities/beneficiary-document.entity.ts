import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne 
} from 'typeorm';
import { Beneficiary } from './beneficiary.entity';
import { Staff } from '../../users/entities/staff.entity';

@Entity('beneficiary_documents')
export class BeneficiaryDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Beneficiary, (beneficiary) => beneficiary.documents)
  beneficiary: Beneficiary;

  @Column({
    type: 'enum',
    enum: [
      'id_card',
      'birth_certificate',
      'school_certificate',
      'medical_report',
      'business_license',
      'other'
    ],
  })
  documentType: string;

  @Column()
  fileUrl: string;

  @Column()
  fileName: string;

  @Column()
  fileSize: number;

  @Column()
  mimeType: string;

  @ManyToOne(() => Staff, { nullable: true })
  uploadedBy: Staff;

  @Column({ default: false })
  verified: boolean;

  @ManyToOne(() => Staff, { nullable: true })
  verifiedBy: Staff;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}