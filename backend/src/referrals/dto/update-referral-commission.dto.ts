import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateReferralCommissionDto {
  @ApiProperty({ example: 10, minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercent: number;
}
