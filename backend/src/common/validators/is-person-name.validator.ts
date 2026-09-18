import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const NAME_REGEX = /^[\p{L}]+(?:[\s'-][\p{L}]+)*$/u;
const NAME_MESSAGE =
  'must contain only letters, spaces, hyphens, or apostrophes';

const trimName = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

/** For required name fields (firstName/lastName): trimmed, letters/spaces/hyphens/apostrophes only, 2-50 chars. */
export function IsPersonName() {
  return applyDecorators(
    trimName(),
    IsString(),
    MinLength(2, { message: 'must be at least 2 characters long' }),
    MaxLength(50, { message: 'must be at most 50 characters long' }),
    Matches(NAME_REGEX, { message: NAME_MESSAGE }),
  );
}

/** For optional name fields: skipped when absent/empty, otherwise same rules as IsPersonName. */
export function IsOptionalPersonName() {
  return applyDecorators(
    trimName(),
    IsOptional(),
    ValidateIf(
      (_object, value) => value !== undefined && value !== null && value !== '',
    ),
    IsString(),
    MinLength(2, { message: 'must be at least 2 characters long' }),
    MaxLength(50, { message: 'must be at most 50 characters long' }),
    Matches(NAME_REGEX, { message: NAME_MESSAGE }),
  );
}
