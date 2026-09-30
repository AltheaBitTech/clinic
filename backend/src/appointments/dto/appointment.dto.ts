import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty() @IsString() patientId: string;
  @ApiProperty() @IsString() doctorId: string;
  @ApiProperty() @IsDateString() scheduledAt: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;

  @ApiPropertyOptional({
    description:
      'ID of the completed appointment whose missed follow-up this booking resolves',
  })
  @IsOptional()
  @IsString()
  followUpOfId?: string;
}

export class UpdateAppointmentDto extends PartialType(
  OmitType(CreateAppointmentDto, ['followUpOfId'] as const),
) {
  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional() @IsOptional() @IsDateString() followUpDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() followUpNotes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cancelReason?: string;
}
