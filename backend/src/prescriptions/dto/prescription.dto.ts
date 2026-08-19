import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MedicineItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiProperty() @IsString() @IsNotEmpty() dosage: string;
  @ApiProperty() @IsString() @IsNotEmpty() frequency: string;
  @ApiProperty() @IsString() @IsNotEmpty() duration: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timing?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() instructions?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  reminderTimes?: string[];
}

export class CreatePrescriptionDto {
  @ApiProperty() @IsString() patientId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() doctorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() appointmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() diagnosis?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() validUntil?: string;
  @ApiProperty({ type: [MedicineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicineItemDto)
  medicines: MedicineItemDto[];
}
