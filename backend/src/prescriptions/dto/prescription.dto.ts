import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
  IsNotEmpty,
  Matches,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// Must contain at least one letter — rejects purely numeric input.
const NOT_PURELY_NUMERIC = /[a-zA-Z]/;
// Letters, spaces, hyphens and apostrophes only (e.g. "Neo-Sporin", "Betnovate N").
const ALPHA_ONLY = /^[A-Za-z][A-Za-z\s'-]*$/;

// Ointment items must be named using alphabetic characters only; other item
// types (e.g. oral medicines) just need to not be purely numeric.
function IsValidMedicineName(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidMedicineName',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (typeof value !== 'string' || value.trim().length === 0) return false;
          const isOintment = (args.object as any).type === 'OINTMENT';
          return isOintment ? ALPHA_ONLY.test(value) : NOT_PURELY_NUMERIC.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          const isOintment = (args.object as any).type === 'OINTMENT';
          return isOintment
            ? 'name must contain only alphabetic characters'
            : 'name must not be purely numeric';
        },
      },
    });
  };
}

export class MedicineItemDto {
  @ApiProperty() @IsString() @IsNotEmpty() @IsValidMedicineName() name: string;

  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(NOT_PURELY_NUMERIC, { message: 'dosage must not be purely numeric' })
  dosage: string;

  @ApiProperty() @IsString() @IsNotEmpty() frequency: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(NOT_PURELY_NUMERIC, { message: 'duration must not be purely numeric' })
  duration: string;

  @ApiPropertyOptional() @IsOptional() @IsString() timing?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(NOT_PURELY_NUMERIC, { message: 'instructions must not be purely numeric' })
  instructions?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  reminderTimes?: string[];
}

export class CreatePrescriptionDto {
  @ApiProperty() @IsString() patientId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() doctorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() appointmentId?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(NOT_PURELY_NUMERIC, { message: 'diagnosis must not be purely numeric' })
  diagnosis?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(NOT_PURELY_NUMERIC, { message: 'notes must not be purely numeric' })
  notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() validUntil?: string;
  @ApiProperty({ type: [MedicineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicineItemDto)
  medicines: MedicineItemDto[];
}
