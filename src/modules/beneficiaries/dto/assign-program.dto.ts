import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AssignProgramDto {
  @ApiProperty({ example: 'program-uuid-here' })
  @IsString()
  @IsNotEmpty()
  programId: string;

  @ApiProperty({ 
    example: '2024-01-01',
    required: false,
    description: 'Optional. Defaults to today if not provided.' 
  })
  @IsOptional()
  @IsDateString()
  enrollmentDate?: string;

  @ApiProperty({ 
    example: 'Additional notes about this assignment',
    required: false 
  })
  @IsOptional()
  @IsString()
  notes?: string;
}