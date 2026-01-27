import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne 
} from 'typeorm';
import { Staff } from '../../users/entities/staff.entity';
import { Language } from '../../../config/constants';

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  title: {
    en: string;
    rw: string;
  };

  @Column({ type: 'jsonb' })
  description: {
    en: string;
    rw: string;
  };

  @Column()
  fileUrl: string;

  @Column()
  fileName: string;

  @Column()
  fileType: string;

  @Column()
  fileSize: number;

  @Column({
    type: 'enum',
    enum: ['report', 'guide', 'form', 'template', 'other'],
  })
  category: string;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ type: 'int', default: 0 })
  downloadCount: number;

  @ManyToOne(() => Staff)
  uploadedBy: Staff;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    version: string;
    language: Language;
    tags: string[];
    thumbnail: string;
  };

  @CreateDateColumn()
  createdAt: Date;
}