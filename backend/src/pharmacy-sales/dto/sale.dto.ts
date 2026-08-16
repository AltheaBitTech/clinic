import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class SaleItemDto {
  @ApiProperty({ example: 'clx123medicine' })
  @IsString()
  @IsNotEmpty()
  medicineId: string;

  @ApiPropertyOptional({
    example: 'clx123batch',
    description: 'Specific batch to sell from; omit to auto-pick by FEFO',
  })
  @IsString()
  @IsOptional()
  batchId?: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    example: 22.0,
    description: 'Overrides the batch sale price if provided',
  })
  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  tax?: number;
}

export class SalePaymentDto {
  @ApiProperty({ example: 'CASH' })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiProperty({ example: 44.0 })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: 'UPI-REF-12345' })
  @IsString()
  @IsOptional()
  referenceNo?: string;
}

export class CreateSaleDto {
  @ApiPropertyOptional({ example: 'clx123patient' })
  @IsString()
  @IsOptional()
  patientId?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiProperty({ type: [SaleItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @ApiProperty({ type: [SalePaymentDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SalePaymentDto)
  payments: SalePaymentDto[];
}

export class ReturnItemDto {
  @ApiProperty({ example: 'clx123medicine' })
  @IsString()
  @IsNotEmpty()
  medicineId: string;

  @ApiProperty({ example: 'clx123batch' })
  @IsString()
  @IsNotEmpty()
  batchId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 22.0 })
  @IsNumber()
  amount: number;
}

export class CreateCustomerReturnDto {
  @ApiProperty({ example: 'Customer changed mind' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ type: [ReturnItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];
}
