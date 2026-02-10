// import { IsOptional, IsEnum } from 'class-validator';
// import { ProgramCategory, ProgramStatus } from '../../../config/constants';
// import { PaginationQueryDto } from './pagination-query.dto';

// export class FilterProgramsDTO extends PaginationQueryDto {
//   @IsOptional()
//   @IsEnum(ProgramCategory)
//   category?: ProgramCategory;

//   @IsOptional()
//   @IsEnum(ProgramStatus)
//   status?: ProgramStatus;
// }

// src/modules/programs/dto/filter-programs.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ProgramCategory, ProgramStatus } from '../../../config/constants';

export class FilterProgramsDTO {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ enum: ProgramCategory })
  @IsOptional()
  @IsEnum(ProgramCategory)
  category?: ProgramCategory;

  @ApiPropertyOptional({ enum: ProgramStatus })
  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;
}