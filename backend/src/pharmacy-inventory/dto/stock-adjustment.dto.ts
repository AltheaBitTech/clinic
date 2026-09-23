import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BatchStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  NotEquals,
} from 'class-validator';

export class CreateStockAdjustmentDto {
  @ApiProperty({ example: 'clx123batch', description: 'Batch to adjust' })
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @ApiProperty({
    example: -5,
    description:
      'Signed quantity change: positive increases stock, negative decreases it',
  })
  @IsInt()
  @NotEquals(0)
  quantityChange: number;

  @ApiProperty({
    example: 'Damaged in storage',
    description: 'Reason for the manual adjustment (required)',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class CreateBatchDto {
  @ApiProperty({ example: 'clx123medicine' })
  @IsString()
  @IsNotEmpty()
  medicineId: string;

  @ApiProperty({ example: 'BATCH-2026-01' })
  @IsString()
  @IsNotEmpty()
  batchNo: string;

  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsDateString()
  @IsOptional()
  mfgDate?: string;

  @ApiProperty({ example: '2027-06-30' })
  @IsDateString()
  expiryDate: string;

  @ApiProperty({ example: 8.5, description: 'Purchase rate per unit' })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiProperty({ example: 12 })
  @IsNumber()
  @Min(0)
  mrp: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  salePrice: number;

  @ApiProperty({ example: 100, description: 'Opening quantity for this batch' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'clx123supplier' })
  @IsString()
  @IsOptional()
  supplierId?: string;

  @ApiProperty({
    example: 'Opening stock entry',
    description: 'Reason for manually adding this batch (required)',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class UpdateBatchDto {
  @ApiPropertyOptional({ example: 'BATCH-2026-01' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  batchNo?: string;

  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsDateString()
  @IsOptional()
  mfgDate?: string;

  @ApiPropertyOptional({ example: '2027-06-30' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 8.5, description: 'Purchase rate per unit' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  purchasePrice?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  mrp?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  salePrice?: number;

  @ApiPropertyOptional({ example: 'clx123supplier' })
  @IsString()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({
    enum: BatchStatus,
    example: BatchStatus.BLOCKED,
    description:
      'Set to BLOCKED to deactivate this batch, or ACTIVE to reactivate it',
  })
  @IsEnum(BatchStatus)
  @IsOptional()
  status?: BatchStatus;
}
