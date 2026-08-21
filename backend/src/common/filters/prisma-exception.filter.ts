import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

function humanizeField(field: string): string {
  const spaced = field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

// Prisma 7's driver-adapter engine reports unique-constraint fields under
// meta.driverAdapterError.cause.constraint.fields instead of the classic meta.target.
function extractConflictFields(
  exception: Prisma.PrismaClientKnownRequestError,
): string[] {
  const meta = (exception.meta ?? {}) as Record<string, any>;
  if (Array.isArray(meta.target)) return meta.target;
  if (typeof meta.target === 'string') return [meta.target];
  const constraintFields = meta.driverAdapterError?.cause?.constraint?.fields;
  if (Array.isArray(constraintFields)) return constraintFields;
  return [];
}

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    console.error('Prisma Error Code:', exception.code);
    console.error('Prisma Error Message:', exception.message);
    console.error('Prisma Error Meta:', JSON.stringify(exception.meta));

    const response = host.switchToHttp().getResponse<Response>();
    const httpException = this.toHttpException(exception);
    response
      .status(httpException.getStatus())
      .json(httpException.getResponse());
  }

  private toHttpException(
    exception: Prisma.PrismaClientKnownRequestError,
  ): HttpException {
    switch (exception.code) {
      case 'P2002': {
        const fields = extractConflictFields(exception).map(humanizeField);
        const message = fields.length
          ? `${fields.join(', ')} already in use. Please use a different value.`
          : 'This record already exists.';
        return new ConflictException(message);
      }
      case 'P2025':
        return new NotFoundException(
          'The requested record could not be found.',
        );
      case 'P2003': {
        const field = (exception.meta as Record<string, any> | undefined)
          ?.field_name as string | undefined;
        const label = field
          ? humanizeField(field.replace(/Id$/, ''))
          : undefined;
        return new ConflictException(
          label
            ? `This action references a ${label} that no longer exists.`
            : 'This action references a related record that no longer exists.',
        );
      }
      default:
        return new BadRequestException(
          `Database error [${exception.code}]: ${exception.message || 'The request could not be processed.'}`,
        );
    }
  }
}
