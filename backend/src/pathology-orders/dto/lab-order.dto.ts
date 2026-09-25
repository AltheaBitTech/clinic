import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CollectionType,
  PaymentStatus,
  SampleRejectionReason,
} from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

class ReferringDoctorFieldsDto {
  @ApiPropertyOptional({
    description: 'Doctor.id, when the referring doctor is in the system',
  })
  @IsString()
  @IsOptional()
  referringDoctorId?: string;

  @ApiPropertyOptional({
    description: 'Free-text fallback for a doctor not in the system',
  })
  @IsString()
  @IsOptional()
  referringDoctorName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referringDoctorPhone?: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Commission percent for this order',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  commissionPercent?: number;
}

class CollectionFieldsDto {
  @ApiPropertyOptional({ enum: CollectionType })
  @IsEnum(CollectionType)
  @IsOptional()
  collectionType?: CollectionType;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  collectionAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  collectorId?: string;
}

export class CreateLabOrderHospitalDto extends ReferringDoctorFieldsDto {
  @ApiProperty({
    description: 'PathologyLab.id to order from (must be actively linked)',
  })
  @IsString()
  @IsNotEmpty()
  labId: string;

  @ApiProperty({ description: "The hospital's own Patient.id" })
  @IsString()
  @IsNotEmpty()
  hospitalPatientId: string;

  @ApiProperty({ type: [String], description: 'LabTestCatalog ids to order' })
  @IsArray()
  @IsString({ each: true })
  testIds: string[];

  @ApiPropertyOptional({ enum: CollectionType })
  @IsEnum(CollectionType)
  @IsOptional()
  collectionType?: CollectionType;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  collectionAddress?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

class WalkInPatientInputDto {
  @ApiProperty({ example: 'Ramesh Kumar' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  @IsOptional()
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;
}

export class CreateLabOrderWalkInDto extends ReferringDoctorFieldsDto {
  @ApiPropertyOptional({
    description: 'Existing LabPatient.id — omit to create a new one',
  })
  @IsString()
  @IsOptional()
  patientId?: string;

  @ApiPropertyOptional({ type: WalkInPatientInputDto })
  @IsOptional()
  patient?: WalkInPatientInputDto;

  @ApiProperty({ type: [String], description: 'LabTestCatalog ids to order' })
  @IsArray()
  @IsString({ each: true })
  testIds: string[];

  @ApiPropertyOptional({ enum: CollectionType })
  @IsEnum(CollectionType)
  @IsOptional()
  collectionType?: CollectionType;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  collectionAddress?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ScheduleCollectionDto extends CollectionFieldsDto {}

export class CancelLabOrderDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cancelReason?: string;
}

export class CollectSampleDto {
  @ApiPropertyOptional({
    enum: ['BLOOD', 'URINE', 'STOOL', 'SPUTUM', 'SWAB', 'CSF', 'TISSUE', 'BIOPSY', 'FNAC', 'BODY_FLUID', 'OTHER'],
    example: 'BLOOD',
  })
  @IsString()
  @IsOptional()
  sampleType?: string;

  @ApiPropertyOptional({ example: 'EDTA' })
  @IsString()
  @IsOptional()
  container?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePaymentStatusDto {
  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsNotEmpty()
  paymentStatus: PaymentStatus;
}

export class RejectSampleDto {
  @ApiProperty({ enum: SampleRejectionReason })
  @IsEnum(SampleRejectionReason)
  @IsNotEmpty()
  rejectionReason: SampleRejectionReason;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  rejectionNotes?: string;
}
