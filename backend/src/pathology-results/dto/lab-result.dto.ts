import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ResultFlag, ResultValueType } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class LabResultValueInputDto {
  @ApiPropertyOptional({
    description:
      'LabTestParameterDef.id, when the test has predefined parameters',
  })
  @IsString()
  @IsOptional()
  parameterId?: string;

  @ApiProperty({ example: 'Hemoglobin' })
  @IsString()
  @IsNotEmpty()
  parameterNameSnapshot: string;

  @ApiPropertyOptional({ enum: ResultValueType, default: ResultValueType.NUMERIC })
  @IsEnum(ResultValueType)
  @IsOptional()
  resultType?: ResultValueType;

  @ApiProperty({ example: '14.2' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ example: 'g/dL' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: '13-17' })
  @IsString()
  @IsOptional()
  refRangeText?: string;

  @ApiPropertyOptional({
    enum: ResultFlag,
    description:
      'Explicit flag override — auto-computed from the parameter range when omitted',
  })
  @IsEnum(ResultFlag)
  @IsOptional()
  flag?: ResultFlag;

  @ApiPropertyOptional({ description: 'Technician/pathologist remark' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ description: 'Uploaded microscopy image/attachment URL' })
  @IsString()
  @IsOptional()
  attachmentUrl?: string;
}

export class EnterLabResultsDto {
  @ApiProperty({ type: [LabResultValueInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LabResultValueInputDto)
  results: LabResultValueInputDto[];
}

export class AmendReportDto {
  @ApiProperty({ description: 'Reason the finalized report is being amended' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class SendLabReportEmailDto {
  @ApiPropertyOptional({
    example: 'patient@example.com',
    description: 'Overrides the patient email on file',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description:
      'Publicly reachable link to the report PDF, as shown to the patient',
  })
  @IsString()
  @IsNotEmpty()
  reportUrl: string;
}

export class AcknowledgeCriticalDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  escalated?: boolean;
}
