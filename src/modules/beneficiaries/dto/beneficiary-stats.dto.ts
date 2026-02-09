import { ApiProperty } from '@nestjs/swagger';

export class StatusStatsDto {
  @ApiProperty({ example: 'active' })
  status: string;
  
  @ApiProperty({ example: '15' })
  count: string;
}

export class ProgramStatsDto {
  @ApiProperty({ example: 'Entrepreneurship Program' })
  name: string;
  
  @ApiProperty({ example: '10' })
  count: string;
}

export class BeneficiaryStatsDto {
  @ApiProperty({ example: 50 })
  totalBeneficiaries: number;
  
  @ApiProperty({ type: [StatusStatsDto] })
  byStatus: StatusStatsDto[];
  
  @ApiProperty({ type: [ProgramStatsDto] })
  byProgram: ProgramStatsDto[];
  
  @ApiProperty({ example: 2500000 })
  totalCapital: number;
}