import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class PurchaseOrderItemDto {
  @ApiProperty({ example: 'clx123medicine' })
  @IsString()
  @IsNotEmpty()
  medicineId: string;

  @ApiProperty({ example: 'BATCH-2026-01' })
  @IsString()
  @IsNotEmpty()
  batchNo: string;

  @ApiProperty({ example: '2027-06-30' })
  @IsDateString()
  expiryDate: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 8.5, description: 'Purchase rate per unit' })
  @IsNumber()
  rate: number;

  @ApiPropertyOptional({ example: 12, description: 'Tax amount for this line' })
  @IsNumber()
  @IsOptional()
  tax?: number;

  @ApiPropertyOptional({ example: '3004' })
  @IsString()
  @IsOptional()
  hsnCode?: string;

  @ApiPropertyOptional({ example: 12, description: 'GST rate percentage' })
  @IsNumber()
  @IsOptional()
  gstPercent?: number;

  @ApiPropertyOptional({
    example: 45.5,
    description: 'MRP per unit as printed on this purchase bill',
  })
  @IsNumber()
  @IsOptional()
  mrp?: number;

  @ApiPropertyOptional({ example: '10x10' })
  @IsString()
  @IsOptional()
  packSize?: string;

  @ApiPropertyOptional({ example: 'Cipla Ltd' })
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Free (bonus) quantity supplied alongside this line',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  freeQty?: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: 'clx123supplier' })
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @ApiProperty({ example: 'PO-2026-0001' })
  @IsString()
  @IsNotEmpty()
  orderNo: string;

  @ApiPropertyOptional({ example: '2026-08-15' })
  @IsDateString()
  @IsOptional()
  orderDate?: string;

  @ApiPropertyOptional({ example: 'INV-2026-4521' })
  @IsString()
  @IsOptional()
  invoiceNo?: string;

  @ApiPropertyOptional({ example: '2026-08-14' })
  @IsDateString()
  @IsOptional()
  invoiceDate?: string;

  @ApiPropertyOptional({ example: 0, description: 'Less Prod Discount' })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ example: 0, description: 'Less Cash Discount' })
  @IsNumber()
  @IsOptional()
  cashDiscount?: number;

  @ApiPropertyOptional({ example: 0, description: 'Less Cr. Note' })
  @IsNumber()
  @IsOptional()
  creditNote?: number;

  @ApiPropertyOptional({ example: 0, description: 'Add Dr. Note' })
  @IsNumber()
  @IsOptional()
  debitNote?: number;

  @ApiPropertyOptional({ example: 0, description: 'Other +/-, R/o adjustment' })
  @IsNumber()
  @IsOptional()
  otherAdjustment?: number;

  @ApiProperty({ type: [PurchaseOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}

export class ReceivePurchaseItemDto {
  @ApiProperty({ example: 'clx123purchaseitem' })
  @IsString()
  @IsNotEmpty()
  purchaseItemId: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  receivedQuantity: number;
}

export class ReceivePurchaseOrderDto {
  @ApiProperty({ type: [ReceivePurchaseItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceivePurchaseItemDto)
  items: ReceivePurchaseItemDto[];
}
