import { IsString, IsOptional, IsNumber, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateDoctorDto {
  @ApiProperty() @IsString() userId: string;
  @ApiProperty() @IsString() specialization: string;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() qualification?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() registrationNo?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() experienceYears?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() consultationFee?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() bio?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() availableDays?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() consultationStart?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() consultationEnd?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() slotDuration?: number;
}

export class UpdateDoctorDto extends PartialType(CreateDoctorDto) {}
