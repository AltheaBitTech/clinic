import { ArrayNotEmpty, IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayoutMethod } from '@prisma/client';

export class RecordReferralPayoutDto {
  @ApiProperty({
    type: [String],
    description: 'IDs of the unpaid ReferralCommission rows this payout covers',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  commissionIds: string[];

  @ApiProperty({ enum: PayoutMethod })
  @IsEnum(PayoutMethod)
  method: PayoutMethod;

  @ApiPropertyOptional({ description: 'Bank UTR / UPI transaction reference' })
  @IsOptional()
  @IsString()
  referenceNo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
