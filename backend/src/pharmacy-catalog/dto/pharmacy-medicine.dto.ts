import { ApiPropertyOptional, ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePharmacyMedicineDto {
  @ApiProperty({ example: 'Paracetamol 500mg' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Paracetamol' })
  @IsString()
  @IsOptional()
  genericName?: string;

  @ApiPropertyOptional({ example: 'Crocin' })
  @IsString()
  @IsOptional()
  brandName?: string;

  @ApiPropertyOptional({ example: 'Paracetamol 500mg' })
  @IsString()
  @IsOptional()
  composition?: string;

  @ApiPropertyOptional({ example: 'TABLET' })
  @IsString()
  @IsOptional()
  form?: string;

  @ApiPropertyOptional({ example: '500mg' })
  @IsString()
  @IsOptional()
  strength?: string;

  @ApiPropertyOptional({ example: '30049099' })
  @IsString()
  @IsOptional()
  hsn?: string;

  @ApiPropertyOptional({
    example: 12,
    description: 'GST % applied to this medicine',
  })
  @IsNumber()
  @IsOptional()
  gst?: number;

  @ApiProperty({ example: 25.5, description: 'Maximum retail price' })
  @IsNumber()
  mrp: number;

  @ApiProperty({ example: 22.0, description: 'Default sale price' })
  @IsNumber()
  salePrice: number;

  @ApiPropertyOptional({ example: '8901234567890' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Reorder threshold for low-stock alerts',
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  prescriptionRequired?: boolean;
}

export class UpdatePharmacyMedicineDto extends PartialType(
  CreatePharmacyMedicineDto,
) {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
