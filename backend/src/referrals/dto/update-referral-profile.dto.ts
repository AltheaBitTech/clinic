import { IsOptional, IsString, Matches, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptionalPhoneNumber10 } from '../../common/validators/is-phone-number.validator';

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const UPI_ID_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

export class UpdateReferralProfileDto {
  @ApiPropertyOptional()
  @IsOptionalPhoneNumber10()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Payout bank account holder name' })
  @IsOptional()
  @IsString()
  bankAccountHolderName?: string;

  @ApiPropertyOptional({ description: 'Payout bank account number' })
  @IsOptional()
  @ValidateIf((_o, v) => v !== undefined && v !== null && v !== '')
  @Matches(/^\d{9,18}$/, {
    message: 'bankAccountNumber must be a 9-18 digit account number',
  })
  bankAccountNumber?: string;

  @ApiPropertyOptional({ example: 'HDFC0001234', description: 'Payout bank IFSC code' })
  @IsOptional()
  @ValidateIf((_o, v) => v !== undefined && v !== null && v !== '')
  @Matches(IFSC_REGEX, { message: 'bankIfscCode must be a valid IFSC code' })
  bankIfscCode?: string;

  @ApiPropertyOptional({ example: 'name@bank', description: 'Payout UPI ID' })
  @IsOptional()
  @ValidateIf((_o, v) => v !== undefined && v !== null && v !== '')
  @Matches(UPI_ID_REGEX, { message: 'upiId must be a valid UPI ID' })
  upiId?: string;
}
