import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType } from '@prisma/client';

export class UploadReportDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'The report file to upload' })
  file: any;

  @ApiProperty({ description: 'The patient ID to associate with the report' })
  @IsString()
  patientId: string;

  @ApiPropertyOptional({ enum: ReportType, description: 'Type of report', default: ReportType.OTHER })
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @ApiPropertyOptional({ description: 'Title of the report' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Name of the testing laboratory' })
  @IsOptional()
  @IsString()
  labName?: string;

  @ApiPropertyOptional({ description: 'Date the report was issued', example: '2026-07-25T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  reportDate?: string;
}
