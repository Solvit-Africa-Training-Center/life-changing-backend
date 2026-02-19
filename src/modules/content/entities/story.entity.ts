// src/modules/content/entities/story.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Program } from '../../programs/entities/program.entity';
import { Beneficiary } from '../../beneficiaries/entities/beneficiary.entity';
import { Language, UserType } from '../../../config/constants';

@Entity('stories')
export class Story {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ name: 'author_name' })
  authorName: string;

  @Column({
    name: 'author_role',
    type: 'enum',
    enum: UserType,
  })
  authorRole: UserType;

  // Program relation (optional)
  @ManyToOne(() => Program, { nullable: true })
  @JoinColumn({ name: 'program_id' })
  program: Program | null;

  // Beneficiary relation (optional)
  @ManyToOne(() => Beneficiary, { nullable: true })
  @JoinColumn({ name: 'beneficiary_id' })
  beneficiary: Beneficiary | null;

  @Column({ type: 'jsonb', nullable: true })
  media: Array<{
    url: string;
    publicId: string;
    type: 'image' | 'video';
    caption: string;
    thumbnail: string;     // Thumbnail URL for videos
    thumbnailPublicId?: string; // Optional: for video thumbnails
  }>;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'is_published', default: true })
  isPublished: boolean;

  @Column({ name: 'published_date', type: 'date' })
  publishedDate: Date;

  @Column({
    type: 'enum',
    enum: Language,
    default: Language.EN,
  })
  language: Language;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @Column({ name: 'share_count', type: 'int', default: 0 })
  shareCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    tags: string[];
    location?: string;
    duration?: number;
  } | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}