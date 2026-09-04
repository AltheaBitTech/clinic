import { registerDecorator, ValidationOptions } from 'class-validator';

/** For date-string fields (e.g. date of birth): rejects dates after today. Skips empty/undefined values. */
export function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotFutureDate',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} cannot be a future date`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (value === undefined || value === null || value === '') return true;
          if (typeof value !== 'string') return false;
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) return false;
          return date.getTime() <= Date.now();
        },
      },
    });
  };
}
