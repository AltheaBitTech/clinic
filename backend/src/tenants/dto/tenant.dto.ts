import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateTenantDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsEmail() email: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() website?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() licenseNumber?: string;
}

export class UpdateTenantDto extends PartialType(CreateTenantDto) {}

export class InviteUserDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty({ enum: UserRole }) @IsEnum(UserRole) role: UserRole;
}
