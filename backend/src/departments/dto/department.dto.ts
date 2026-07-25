import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ description: 'The name of the department', example: 'Cardiology' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'A brief description of the department', example: 'Diagnosis and treatment of heart disease' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
