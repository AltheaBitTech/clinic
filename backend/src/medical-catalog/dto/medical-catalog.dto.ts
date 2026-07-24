import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicalCatalogItemDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  @IsIn(['MEDICINE', 'OINTMENT'])
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dosage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  frequency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timing?: string;
}
