import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
  IsArray,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { IsOptionalPhoneNumber10 } from '../../common/validators/is-phone-number.validator';
import { IsNotFutureDate } from '../../common/validators/is-not-future-date.validator';

export class CreatePatientDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiPropertyOptional() @IsOptionalPhoneNumber10() phone?: string;
  @ApiPropertyOptional({
    description: 'Whether the patient has opted in to WhatsApp notifications',
  })
  @IsOptional()
  @IsBoolean()
  whatsappOptIn?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsDateString() @IsNotFutureDate() dateOfBirth?: string;
  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
  @ApiPropertyOptional() @IsOptional() @IsString() bloodGroup?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyName?: string;
  @ApiPropertyOptional() @IsOptionalPhoneNumber10() emergencyPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyRelation?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  allergies?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  chronicConditions?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdatePatientDto extends PartialType(CreatePatientDto) {}

export class AddFamilyMemberDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() relation: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() @IsNotFutureDate() dateOfBirth?: string;
  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
  @ApiPropertyOptional() @IsOptional() @IsString() bloodGroup?: string;
  @ApiPropertyOptional() @IsOptionalPhoneNumber10() phone?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  allergies?: string[];
}
