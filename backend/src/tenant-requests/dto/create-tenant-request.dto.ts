import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantRequestDto {
  @ApiProperty({ description: 'Hospital or Clinic Name' })
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

  @ApiPropertyOptional({ description: 'Contact Phone Number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Street Address' })
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
