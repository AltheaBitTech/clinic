import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { IsPhoneNumber10 } from '../../common/validators/is-phone-number.validator';
import { IsPersonName } from '../../common/validators/is-person-name.validator';

export class CreatePathologyLabDto {
  @ApiProperty({ example: 'Sunrise Diagnostics', description: 'Lab name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Dr. Anita Rao' })
  @IsString()
  @IsOptional()
  ownerName?: string;

  @ApiPropertyOptional({ example: 'LAB-2024-001234' })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiPropertyOptional({
    example: 'NABL-T-1234',
    description: 'Accreditation number (e.g. NABL)',
  })
  @IsString()
  @IsOptional()
  accreditationNo?: string;

  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @IsPhoneNumber10()
  phone: string;

  @ApiPropertyOptional({ example: 'sunrise@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '12, MG Road, Koramangala' })
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

  @ApiPropertyOptional({ example: '08:00' })
  @IsString()
  @IsOptional()
  openingHours?: string;

  @ApiPropertyOptional({ example: '22:00' })
  @IsString()
  @IsOptional()
  closingHours?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether home sample collection is offered',
  })
  @IsBoolean()
  @IsOptional()
  homeCollectionAvailable?: boolean;

  @ApiPropertyOptional({ example: 100, description: 'Home collection fee' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  homeCollectionFee?: number;

  @ApiPropertyOptional({ example: 'NABL accredited, reports in 24h' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdatePathologyLabDto extends PartialType(CreatePathologyLabDto) {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class InvitePathologyLabDto {
  @ApiPropertyOptional({
    example: 'sunrise@example.com',
    description:
      'Email address to send the self-registration invite link to. If omitted, only the link is generated for manual sharing.',
  })
  @IsEmail()
  @IsOptional()
  email?: string;
}

export class CompletePathologyLabInviteDto {
  @ApiProperty({ example: 'Sunrise Diagnostics', description: 'Lab name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Dr. Anita Rao' })
  @IsString()
  @IsOptional()
  ownerName?: string;

  @ApiPropertyOptional({ example: 'LAB-2024-001234' })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiPropertyOptional({
    example: 'NABL-T-1234',
    description: 'Accreditation number (e.g. NABL)',
  })
  @IsString()
  @IsOptional()
  accreditationNo?: string;

  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @IsPhoneNumber10()
  phone: string;

  @ApiProperty({
    example: 'sunrise@example.com',
    description: 'Used for the lab account login',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '12, MG Road, Koramangala' })
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

  @ApiPropertyOptional({ example: '08:00' })
  @IsString()
  @IsOptional()
  openingHours?: string;

  @ApiPropertyOptional({ example: '22:00' })
  @IsString()
  @IsOptional()
  closingHours?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether home sample collection is offered',
  })
  @IsBoolean()
  @IsOptional()
  homeCollectionAvailable?: boolean;

  @ApiPropertyOptional({ example: 100, description: 'Home collection fee' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  homeCollectionFee?: number;

  @ApiPropertyOptional({ example: 'NABL accredited, reports in 24h' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'Anita' })
  @IsPersonName()
  firstName: string;

  @ApiProperty({ example: 'Rao' })
  @IsPersonName()
  lastName: string;

  @ApiProperty({
    example: 'StrongPass123!',
    description: 'Password for the lab login account',
  })
  @IsString()
  @MinLength(8)
  password: string;
}
