import { applyDecorators } from '@nestjs/common';
import { IsOptional, IsString, Matches, ValidateIf } from 'class-validator';

const PHONE_REGEX = /^\d{10}$/;
const PHONE_MESSAGE = 'phone must be a valid 10-digit number';

/** For required phone fields: must be a 10-digit string. */
export function IsPhoneNumber10() {
  return applyDecorators(
    IsString(),
    Matches(PHONE_REGEX, { message: PHONE_MESSAGE }),
  );
}

/** For optional phone fields: skipped when absent/empty, otherwise must be a 10-digit string. */
export function IsOptionalPhoneNumber10() {
  return applyDecorators(
    IsOptional(),
    ValidateIf((_object, value) => value !== undefined && value !== null && value !== ''),
    IsString(),
    Matches(PHONE_REGEX, { message: PHONE_MESSAGE }),
  );
}
