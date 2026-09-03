import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { IsOptionalPhoneNumber10 } from '../../common/validators/is-phone-number.validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Wellness Distributors Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptionalPhoneNumber10()
  phone?: string;

  @ApiPropertyOptional({ example: 'orders@wellnessdist.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Plot 4, Industrial Area, Pune' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '27AAECW1234A1Z5' })
  @IsString()
  @IsOptional()
  gstin?: string;

  @ApiPropertyOptional({ example: 'DL-2024-56789' })
  @IsString()
  @IsOptional()
  licenseNo?: string;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
