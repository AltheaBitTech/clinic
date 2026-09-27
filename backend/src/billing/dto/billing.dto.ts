import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'The unique identifier of the patient' })
  @IsString()
  patientId: string;

  @ApiPropertyOptional({
    description: 'The unique identifier of the associated appointment',
  })
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiPropertyOptional({
    description:
      'The unique identifier of the treating doctor. Required when appointmentId is not provided (the doctor is otherwise derived from the appointment).',
  })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiProperty({ description: 'The base amount for the invoice' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Discount applied to the invoice' })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional({ description: 'Tax amount applied to the invoice' })
  @IsOptional()
  @IsNumber()
  tax?: number;

  @ApiPropertyOptional({ description: 'Additional notes or comments' })
  @IsOptional()
  @IsString()
  notes?: string;
}
