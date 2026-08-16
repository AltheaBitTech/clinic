import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class PrescriptionItemDto {
  @ApiPropertyOptional({
    example: 'clx123medicine',
    description: 'Catalog medicine, if it maps to one already in this pharmacy',
  })
  @IsString()
  @IsOptional()
  medicineId?: string;

  @ApiProperty({ example: 'Paracetamol 500mg' })
  @IsString()
  @IsNotEmpty()
  medicineName: string;

  @ApiPropertyOptional({ example: '1 tablet' })
  @IsString()
  @IsOptional()
  dosage?: string;

  @ApiPropertyOptional({ example: 'Twice a day' })
  @IsString()
  @IsOptional()
  frequency?: string;

  @ApiPropertyOptional({ example: '5 days' })
  @IsString()
  @IsOptional()
  duration?: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 'After food' })
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class CreatePharmacyPrescriptionDto {
  @ApiProperty({ example: 'clx123patient' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiPropertyOptional({
    example: 'clx123doctor',
    description: 'Arogyix Doctor.id, if known',
  })
  @IsString()
  @IsOptional()
  doctorId?: string;

  @ApiPropertyOptional({
    example: 'clx123appointment',
    description: 'Arogyix Appointment.id, if known',
  })
  @IsString()
  @IsOptional()
  appointmentId?: string;

  @ApiPropertyOptional({
    example: 'clx123prescription',
    description: 'Arogyix Prescription.id this was imported from, if any',
  })
  @IsString()
  @IsOptional()
  arogyixPrescriptionId?: string;

  @ApiPropertyOptional({ example: 'Viral fever' })
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiPropertyOptional({ example: 'Rest and hydration' })
  @IsString()
  @IsOptional()
  advice?: string;

  @ApiProperty({ type: [PrescriptionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];
}

export class DispenseItemDto {
  @ApiProperty({ example: 'clx123prescriptionitem' })
  @IsString()
  @IsNotEmpty()
  prescriptionItemId: string;

  @ApiPropertyOptional({
    example: 'clx123batch',
    description: 'Specific batch to dispense from; omit to auto-pick by FEFO',
  })
  @IsString()
  @IsOptional()
  batchId?: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class DispensePrescriptionDto {
  @ApiProperty({ type: [DispenseItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DispenseItemDto)
  items: DispenseItemDto[];
}
