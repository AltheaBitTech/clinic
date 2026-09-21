import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType } from '@prisma/client';

export class UploadReportDto {
  // Multer's FileInterceptor strips the actual upload out of the body before
  // this DTO is validated, so this field only exists to document the
  // multipart schema for Swagger. It still needs a class-validator decorator
  // (even a no-op one) — otherwise the global ValidationPipe's
  // forbidNonWhitelisted check rejects the request with "property file
  // should not exist" whenever this key is present on the parsed body.
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The report file to upload',
  })
  @IsOptional()
  file: any;

  @ApiPropertyOptional({
    description:
      "The patient ID to associate with the report. Required for staff uploads; ignored for patient-role uploads, which are always associated with the caller's own patient record.",
  })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({
    enum: ReportType,
    description: 'Type of report',
    default: ReportType.OTHER,
  })
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

  @ApiPropertyOptional({
    description: 'Date the report was issued',
    example: '2026-07-25T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  reportDate?: string;
}
