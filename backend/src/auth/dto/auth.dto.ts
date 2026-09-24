import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { IsOptionalPhoneNumber10 } from '../../common/validators/is-phone-number.validator';
import { IsNotFutureDate } from '../../common/validators/is-not-future-date.validator';
import {
  IsPersonName,
  IsOptionalPersonName,
} from '../../common/validators/is-person-name.validator';

function normalizeEmail(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptionalPhoneNumber10()
  phone?: string;

  @ApiProperty({ example: 'John' })
  @IsPersonName()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsPersonName()
  lastName: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'ID of the hospital the patient is registering with',
  })
  @IsString()
  tenantId: string;

  @ApiProperty({
    description:
      'Short-lived token from POST /auth/register/verify-email-otp proving this email was verified',
  })
  @IsString()
  emailVerificationToken: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  @IsNotFutureDate()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional() @IsOptional() @IsString() bloodGroup?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptionalPersonName() emergencyName?: string;
  @ApiPropertyOptional() @IsOptionalPhoneNumber10() emergencyPhone?: string;
  @ApiPropertyOptional() @IsOptionalPersonName() emergencyRelation?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  allergies?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  chronicConditions?: string[];
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

export class OtpLoginDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class AcceptInviteDto {
  @ApiProperty()
  @IsString()
  token: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty()
  @IsPersonName()
  firstName: string;

  @ApiProperty()
  @IsPersonName()
  lastName: string;
}

export class SendRegisterEmailOtpDto {
  @ApiProperty({ example: 'john@example.com' })
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsOptionalPersonName()
  firstName?: string;
}

export class VerifyRegisterEmailOtpDto {
  @ApiProperty({ example: 'john@example.com' })
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit code' })
  otp: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@example.com' })
  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token from the password reset email link' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'newPassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
