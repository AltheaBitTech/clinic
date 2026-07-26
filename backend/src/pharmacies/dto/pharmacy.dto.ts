import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePharmacyDto {
  @ApiProperty({ example: 'MedPlus Pharmacy', description: 'Pharmacy name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Ramesh Shah', description: 'Owner / manager name' })
  @IsString()
  @IsOptional()
  ownerName?: string;

  @ApiPropertyOptional({ example: 'PH-2024-001234', description: 'Pharmacy license/registration number' })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiProperty({ example: '+91 98765 43210', description: 'Primary contact phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ example: 'medplus@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '12, MG Road, Koramangala', description: 'Full street address' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Karnataka' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '560034' })
  @IsString()
  @IsOptional()
  pincode?: string;

  @ApiPropertyOptional({ example: '08:00', description: 'Opening time (HH:mm)' })
  @IsString()
  @IsOptional()
  openingHours?: string;

  @ApiPropertyOptional({ example: '22:00', description: 'Closing time (HH:mm)' })
  @IsString()
  @IsOptional()
  closingHours?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether home delivery is available' })
  @IsBoolean()
  @IsOptional()
  homeDeliveryAvailable?: boolean;

  @ApiPropertyOptional({ example: 'Accepts digital prescriptions from Arogyix' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePharmacyDto extends PartialType(CreatePharmacyDto) {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
