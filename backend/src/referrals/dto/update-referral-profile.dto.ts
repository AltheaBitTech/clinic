import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptionalPhoneNumber10 } from '../../common/validators/is-phone-number.validator';

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
}
