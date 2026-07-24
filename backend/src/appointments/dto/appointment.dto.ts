import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty() @IsString() patientId: string;
  @ApiProperty() @IsString() doctorId: string;
  @ApiProperty() @IsDateString() scheduledAt: string;
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional() @IsOptional() @IsDateString() followUpDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() followUpNotes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cancelReason?: string;
}
