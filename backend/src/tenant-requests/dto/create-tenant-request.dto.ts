import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantType } from '@prisma/client';

export class CreateTenantRequestDto {
  @ApiPropertyOptional({
    description: 'Type of tenant being requested',
    enum: TenantType,
    default: TenantType.HOSPITAL,
  })
  @IsOptional()
  @IsEnum(TenantType)
  type?: TenantType;

  @ApiProperty({ description: 'Hospital/Clinic/Pharmacy Business Name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Admin Email Address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Admin First Name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Admin Last Name' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({
    description: 'Contact Phone Number (required when type is PHARMACY)',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Street Address (required when type is PHARMACY)',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State' })
  @IsOptional()
  @IsString()
  state?: string;
}
