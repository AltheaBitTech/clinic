import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ResultValueType } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class LabTestParameterInputDto {
  @ApiProperty({ example: 'Hemoglobin' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'g/dL' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({
    enum: ResultValueType,
    default: ResultValueType.NUMERIC,
    description: 'How this parameter is captured/rendered',
  })
  @IsEnum(ResultValueType)
  @IsOptional()
  resultType?: ResultValueType;

  @ApiPropertyOptional({
    type: [String],
    description: 'Selectable values when resultType is DROPDOWN',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional({ example: 13 })
  @IsNumber()
  @IsOptional()
  refRangeLow?: number;

  @ApiPropertyOptional({ example: 17 })
  @IsNumber()
  @IsOptional()
  refRangeHigh?: number;

  @ApiPropertyOptional({ example: 'Varies by age/sex' })
  @IsString()
  @IsOptional()
  refRangeText?: string;

  @ApiPropertyOptional({
    example: 7,
    description: 'Below this value, the result is flagged CRITICAL',
  })
  @IsNumber()
  @IsOptional()
  criticalRangeLow?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Above this value, the result is flagged CRITICAL',
  })
  @IsNumber()
  @IsOptional()
  criticalRangeHigh?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  criticalRangeText?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @IsOptional()
  displayOrder?: number;
}

export class CreateLabTestDto {
  @ApiProperty({ example: 'Complete Blood Count (CBC)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'CBC' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ example: 'Hematology' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    example: 'Hematology',
    description: 'Lab department this test is processed under',
  })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ example: 'Blood' })
  @IsString()
  @IsNotEmpty()
  sampleType: string;

  @ApiPropertyOptional({ example: 'EDTA' })
  @IsString()
  @IsOptional()
  container?: string;

  @ApiPropertyOptional({ example: 'Flow cytometry' })
  @IsString()
  @IsOptional()
  method?: string;

  @ApiProperty({ example: 400 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 24 })
  @IsInt()
  @IsOptional()
  turnaroundHours?: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  fastingRequired?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  homeCollectionSupported?: boolean;

  @ApiPropertyOptional({ type: [LabTestParameterInputDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LabTestParameterInputDto)
  parameters?: LabTestParameterInputDto[];

  @ApiPropertyOptional({
    description:
      'ID of the master test this catalog entry was imported from, if any',
  })
  @IsString()
  @IsOptional()
  masterTestId?: string;
}

export class UpdateLabTestDto extends PartialType(CreateLabTestDto) {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
