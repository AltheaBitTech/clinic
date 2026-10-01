import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { Response } from 'express';
import { ErrorAlertService } from '../../monitoring/error-alert.service';
import type { RequestWithId } from '../../monitoring/request-id.middleware';
import {
  mapPrismaError,
  unknownPrismaErrorResponse,
} from './prisma-exception.filter';

type AuthedRequest = RequestWithId & {
  user?: { id?: string; role?: string; tenantId?: string | null };
};

/**
 * Single global exception filter. Client errors (4xx) pass through unchanged;
 * anything that is our fault (5xx, unknown Prisma codes, uncaught exceptions)
 * is emailed to the team via ErrorAlertService before responding.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly errorAlerts: ErrorAlertService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      await this.errorAlerts.report(exception, { source: host.getType() });
      return;
    }

    const ctx = host.switchToHttp();
    const req = ctx.getRequest<AuthedRequest>();
    const res = ctx.getResponse<Response>();

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = mapPrismaError(exception);
      if (mapped) return this.sendHttpException(res, mapped);
      await this.alert(exception, req, HttpStatus.BAD_REQUEST);
      return this.sendHttpException(res, unknownPrismaErrorResponse(exception));
    }

    if (
      exception instanceof HttpException &&
      exception.getStatus() < HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      return this.sendHttpException(res, exception);
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const requestId = await this.alert(exception, req, status);

    if (res.headersSent) return;
    res.status(status).json({
      statusCode: status,
      message:
        'Something went wrong on our side. Our team has been notified — please try again shortly.',
      requestId,
    });
  }

  private async alert(
    exception: unknown,
    req: AuthedRequest,
    status: number,
  ): Promise<string> {
    const requestId = req.requestId ?? randomUUID();
    const routePath: string = req.route?.path ?? req.path ?? '';
    const cron = routePath.match(/\/reminders\/cron\/([^/]+)/);

    await this.errorAlerts.report(exception, {
      source: cron ? `cron:${cron[1]}` : 'http',
      method: req.method,
      // Route pattern only (e.g. /api/v1/patients/:id) — never the raw URL,
      // whose query string could contain patient data.
      route: req.route?.path ?? '(unmatched route)',
      status,
      tenantId: req.user?.tenantId,
      userId: req.user?.id,
      role: req.user?.role,
      requestId,
    });
    return requestId;
  }

  private sendHttpException(res: Response, exception: HttpException) {
    if (res.headersSent) return;
    const body = exception.getResponse();
    res
      .status(exception.getStatus())
      .json(
        typeof body === 'string'
          ? { statusCode: exception.getStatus(), message: body }
          : body,
      );
  }
}
