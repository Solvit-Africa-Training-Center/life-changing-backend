import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString,} from 'class-validator';
import { AuthorRole, Language } from '../../../config/constants';

export class CreateStoryDto {
  @IsNotEmpty()
  title: {
    en: string;
    rw: string;
  };

  @IsNotEmpty()
  content: {
    en: string;
    rw: string;
  };

  @IsString()
  authorName: string;

  @IsEnum(AuthorRole)
  authorRole: AuthorRole;

  @IsOptional()
  @IsString()
  authorPhoto?: string;

  @IsOptional()
  programId?: string;

  @IsOptional()
  beneficiaryId?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsEnum(Language)
  language?: Language;
}
