import { ApiProperty } from '@nestjs/swagger';

export class CountryStatsDto {
  @ApiProperty()
  country: string;
  
  @ApiProperty()
  count: string;
  
  @ApiProperty()
  total: string;
}

export class DonorStatsDto {
  @ApiProperty()
  totalDonors: number;
  
  @ApiProperty()
  totalDonated: number;
  
  @ApiProperty()
  recurringDonors: number;
  
  @ApiProperty({ type: [CountryStatsDto] })
  byCountry: CountryStatsDto[];
}