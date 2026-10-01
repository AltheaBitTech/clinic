import {
  ArgumentsHost,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorAlertService } from '../../monitoring/error-alert.service';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let report: jest.Mock;
  let filter: AllExceptionsFilter;
  let res: { status: jest.Mock; json: jest.Mock; headersSent: boolean };
  let req: any;
  let host: ArgumentsHost;

  beforeEach(() => {
    report = jest.fn().mockResolvedValue(undefined);
    filter = new AllExceptionsFilter({ report } as unknown as ErrorAlertService);
    res = { status: jest.fn(), json: jest.fn(), headersSent: false };
    res.status.mockReturnValue(res);
    req = {
      method: 'GET',
      path: '/api/v1/patients/abc',
      route: { path: '/api/v1/patients/:id' },
      requestId: 'req-abcdef12',
      user: { id: 'u1', role: 'DOCTOR', tenantId: 't1' },
    };
    host = {
      getType: () => 'http',
      switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
    } as unknown as ArgumentsHost;
  });

  const prismaError = (code: string, meta?: Record<string, unknown>) =>
    new Prisma.PrismaClientKnownRequestError('db error', {
      code,
      clientVersion: 'test',
      meta,
    });

  it('passes 4xx HttpExceptions through unchanged without alerting', async () => {
    await filter.catch(new BadRequestException(['name must be a string']), host);
    expect(report).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      statusCode: 400,
      message: ['name must be a string'],
      error: 'Bad Request',
    });
  });

  it('alerts on unknown errors and returns a generic 500 with requestId', async () => {
    await filter.catch(new TypeError('x is undefined'), host);
    expect(report).toHaveBeenCalledWith(expect.any(TypeError), {
      source: 'http',
      method: 'GET',
      route: '/api/v1/patients/:id',
      status: 500,
      tenantId: 't1',
      userId: 'u1',
      role: 'DOCTOR',
      requestId: 'req-abcdef12',
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0]).toMatchObject({
      statusCode: 500,
      requestId: 'req-abcdef12',
    });
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('x is undefined');
  });

  it('alerts on 5xx HttpExceptions', async () => {
    await filter.catch(new InternalServerErrorException('boom'), host);
    expect(report).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('keeps mapping known Prisma errors without alerting', async () => {
    await filter.catch(prismaError('P2002', { target: ['email'] }), host);
    expect(report).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].message).toBe(
      'Email already in use. Please use a different value.',
    );

    await filter.catch(prismaError('P2025'), host);
    expect(res.status).toHaveBeenLastCalledWith(404);
    expect(report).not.toHaveBeenCalled();
  });

  it('alerts on unrecognised Prisma codes', async () => {
    await filter.catch(prismaError('P2010'), host);
    expect(report).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('tags cron routes with a cron source', async () => {
    req.route = { path: '/api/v1/reminders/cron/medicine' };
    req.user = undefined;
    await filter.catch(new Error('db timeout'), host);
    expect(report.mock.calls[0][1].source).toBe('cron:medicine');
  });

  it('does not alert on unmatched-route 404s', async () => {
    req.route = undefined;
    await filter.catch(new NotFoundException('Cannot GET /nope'), host);
    expect(report).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
