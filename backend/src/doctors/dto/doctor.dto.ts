import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// Must contain at least one letter — rejects purely numeric input.
const NOT_PURELY_NUMERIC = /[a-zA-Z]/;
// Strict 24h HH:mm time format.
const TIME_FORMAT = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateDoctorDto {
  @ApiProperty() @IsString() userId: string;
  @ApiProperty()
  @IsString()
  @Matches(NOT_PURELY_NUMERIC, { message: 'specialization must not be purely numeric' })
  specialization: string;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(NOT_PURELY_NUMERIC, { message: 'qualification must not be purely numeric' })
  qualification?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() registrationNo?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() experienceYears?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() consultationFee?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(NOT_PURELY_NUMERIC, { message: 'bio must not be purely numeric' })
  bio?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  availableDays?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(TIME_FORMAT, { message: 'consultationStart must be a valid 24h time in HH:mm format' })
  consultationStart?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(TIME_FORMAT, { message: 'consultationEnd must be a valid 24h time in HH:mm format' })
  consultationEnd?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() slotDuration?: number;
}

export class UpdateDoctorDto extends PartialType(CreateDoctorDto) {}
