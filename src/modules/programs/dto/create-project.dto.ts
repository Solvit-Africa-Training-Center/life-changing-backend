import { IsObject, IsNumber, IsOptional } from 'class-validator';

export class CreateProjectDTO {
  @IsObject()
  name: {
    en: string;
    rw: string;
  };

  @IsObject()
  description: {
    en: string;
    rw: string;
  };

  @IsNumber()
  budgetRequired: number;

  // ⭐ TIMELINE
  @IsOptional()
  @IsObject()
  timeline?: {
    start: string;
    end: string;
    milestones: any[];
  };

  // ⭐ LOCATION
  @IsOptional()
  @IsObject()
  location?: {
    districts: string[];
    sectors: string[];
  };

  // ⭐ IMPACT METRICS
  @IsOptional()
  @IsObject()
  impactMetrics?: {
    beneficiariesTarget: number;
    beneficiariesReached: number;
    successIndicators: any[];
  };
}
