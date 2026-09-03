import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsOptionalPhoneNumber10 } from '../../common/validators/is-phone-number.validator';

export class CreatePharmacyPatientDto {
  @ApiProperty({ example: 'Anita Sharma' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptionalPhoneNumber10()
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
