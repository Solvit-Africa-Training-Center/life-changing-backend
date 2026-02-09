import { ApiProperty } from '@nestjs/swagger';

export class RoleStatsDto {
  @ApiProperty({ example: 'admin' })
  role: string;
  
  @ApiProperty({ example: '5' })
  count: string;
}

export class DepartmentStatsDto {
  @ApiProperty({ example: 'Program Management' })
  department: string;
  
  @ApiProperty({ example: '3' })
  count: string;
}

export class StaffStatsDto {
  @ApiProperty({ example: 25 })
  totalStaff: number;
  
  @ApiProperty({ example: 20 })
  activeStaff: number;
  
  @ApiProperty({ type: [RoleStatsDto] })
  byRole: RoleStatsDto[];
  
  @ApiProperty({ type: [DepartmentStatsDto] })
  byDepartment: DepartmentStatsDto[];
}