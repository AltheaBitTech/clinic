import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePharmacyPatientDto {
  @ApiProperty({ example: 'Anita Sharma' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'anita@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'clx123arogyixpatient',
    description:
      'Linked Arogyix Patient.id, if the patient already exists in the hospital system',
  })
  @IsString()
  @IsOptional()
  arogyixPatientId?: string;
}
