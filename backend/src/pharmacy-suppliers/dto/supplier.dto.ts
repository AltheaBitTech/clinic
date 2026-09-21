import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsOptionalPhoneNumber10 } from '../../common/validators/is-phone-number.validator';
import { IsOptionalGstin } from '../../common/validators/is-gstin.validator';

const LICENSE_NO_REGEX = /^[A-Za-z0-9/-]{4,30}$/;

export class CreateSupplierDto {
  @ApiProperty({ example: 'Wellness Distributors Pvt Ltd' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptionalPhoneNumber10()
  phone?: string;

  @ApiPropertyOptional({ example: 'orders@wellnessdist.com' })
  @IsEmail()
  @IsOptional()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ example: 'Plot 4, Industrial Area, Pune' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional({ example: '27AAECW1234A1Z5' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsOptionalGstin()
  gstin?: string;

  @ApiPropertyOptional({ example: 'DL-2024-56789' })
  @IsOptional()
  @ValidateIf((_object, value) => value !== undefined && value !== null && value !== '')
  @IsString()
  @Length(4, 30)
  @Matches(LICENSE_NO_REGEX, {
    message:
      'licenseNo must be 4-30 characters and contain only letters, numbers, "-" and "/"',
  })
  licenseNo?: string;
}

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
