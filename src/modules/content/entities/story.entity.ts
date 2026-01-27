import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne 
} from 'typeorm';
import { Program } from '../../programs/entities/program.entity';
import { Language } from '../../../config/constants';

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

  @Column()
  authorName: string;

  @Column({
    type: 'enum',
    enum: ['beneficiary', 'donor', 'staff', 'partner', 'volunteer'],
  })
  authorRole: string;

  @Column({ nullable: true })
  authorPhoto: string;

  @ManyToOne(() => Program, { nullable: true })
  program: Program;

  @Column({ nullable: true })
  beneficiaryId: string;

  @Column({ type: 'jsonb', nullable: true })
  media: Array<{
    url: string;
    type: 'image' | 'video';
    caption: string;
    thumbnail: string;
  }>;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: true })
  isPublished: boolean;

  @Column({ type: 'date' })
  publishedDate: Date;

  @Column({
    type: 'enum',
    enum: Language,
    default: Language.BOTH,
  })
  language: Language;

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  shareCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    tags: string[];
    location: string;
    duration: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}