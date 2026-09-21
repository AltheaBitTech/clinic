import { applyDecorators } from '@nestjs/common';
import { IsOptional, Matches, ValidateIf } from 'class-validator';

const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const GSTIN_MESSAGE = 'gstin must be a valid 15-character GSTIN';

/** For optional GSTIN fields: skipped when absent/empty, otherwise must match the standard 15-char GSTIN format. */
export function IsOptionalGstin() {
  return applyDecorators(
    IsOptional(),
    ValidateIf((_object, value) => value !== undefined && value !== null && value !== ''),
    Matches(GSTIN_REGEX, { message: GSTIN_MESSAGE }),
  );
}
