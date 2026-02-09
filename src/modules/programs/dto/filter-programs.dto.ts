import { IsOptional, IsEnum } from 'class-validator';
import { ProgramCategory, ProgramStatus } from '../../../config/constants';
import { PaginationQueryDto } from './pagination-query.dto';

export class FilterProgramsDTO extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ProgramCategory)
  category?: ProgramCategory;

  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;
}
