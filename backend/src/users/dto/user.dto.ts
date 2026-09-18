import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptionalPhoneNumber10 } from '../../common/validators/is-phone-number.validator';
import { IsOptionalPersonName } from '../../common/validators/is-person-name.validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: 'User first name', example: 'John' })
  @IsOptionalPersonName()
  firstName?: string;

  @ApiPropertyOptional({ description: 'User last name', example: 'Doe' })
  @IsOptionalPersonName()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '9876543210',
  })
  @IsOptionalPhoneNumber10()
  phone?: string;

  @ApiPropertyOptional({ description: 'URL of user avatar image' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether the user has opted in to WhatsApp notifications',
  })
  @IsOptional()
  @IsBoolean()
  whatsappOptIn?: boolean;
}

export class UploadAvatarDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'The avatar image file',
  })
  file: any;
}
