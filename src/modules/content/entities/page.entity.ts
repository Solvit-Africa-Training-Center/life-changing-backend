import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne 
} from 'typeorm';
import { Language } from '../../../config/constants';

@Entity('pages')
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'jsonb' })
  title: {
    en: string;
    rw: string;
  };

  @Column({ type: 'jsonb' })
  content: {
    en: string;
    rw: string;
  };

  @Column({
    type: 'enum',
    enum: ['about', 'program', 'story', 'resource', 'contact', 'faq'],
  })
  pageType: string;

  @ManyToOne(() => Page, { nullable: true })
  parentPage: Page;

  @Column({ default: true })
  isPublished: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'jsonb', nullable: true })
  metaTitle: {
    en: string;
    rw: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  metaDescription: {
    en: string;
    rw: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    featuredImage: string;
    author: string;
    lastUpdated: Date;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}