import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorAlertService } from './error-alert.service';

describe('ErrorAlertService', () => {
  let service: ErrorAlertService;
  let send: jest.Mock;
  let rows: Map<string, any>;
  let configValues: Record<string, string | undefined>;
  let prisma: any;

  beforeEach(() => {
    rows = new Map();
    configValues = {
      ALERTS_ENABLED: 'true',
      ALERT_EMAILS: 'ops@example.com, dev@example.com',
      RESEND_API_KEY: 'key',
      RESEND_FROM_EMAIL: 'alerts@example.com',
      APP_ENV_LABEL: 'prod',
      ALERT_COOLDOWN_MINUTES: '60',
    };
    prisma = {
      errorEvent: {
        upsert: jest.fn(async ({ where, create }) => {
          const row = rows.get(where.fingerprint);
          if (row) {
            row.count += 1;
            return { ...row };
          }
          const created = {
            id: `id-${rows.size}`,
            ...create,
            count: 1,
            firstSeenAt: new Date(),
            lastAlertedAt: null,
          };
          rows.set(where.fingerprint, created);
          return { ...created };
        }),
        updateMany: jest.fn(async ({ where, data }) => {
          const row = [...rows.values()].find((r) => r.id === where.id);
          const cutoff = where.OR[1].lastAlertedAt.lte as Date;
          if (!row || (row.lastAlertedAt && row.lastAlertedAt > cutoff)) {
            return { count: 0 };
          }
          row.lastAlertedAt = data.lastAlertedAt;
          return { count: 1 };
        }),
      },
      tenant: {
        findUnique: jest.fn().mockResolvedValue({ name: 'City Hospital' }),
      },
    };
    service = new ErrorAlertService(
      prisma as unknown as PrismaService,
      { get: (key: string) => configValues[key] } as ConfigService,
    );
    send = jest.fn().mockResolvedValue({ data: { id: 'x' }, error: null });
    jest
      .spyOn(service, 'createResendClient')
      .mockReturnValue({ emails: { send } } as never);
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => jest.restoreAllMocks());

  const boom = () => {
    const err = new TypeError("Cannot read properties of undefined (reading 'id')");
    err.stack = `TypeError: Cannot read properties of undefined (reading 'id')
    at AppointmentsService.create (/app/src/appointments/appointments.service.ts:212:17)
    at /app/node_modules/@nestjs/core/router/router-execution-context.js:46:28`;
    return err;
  };
  const ctx = {
    source: 'http',
    method: 'POST',
    route: '/api/v1/appointments',
    status: 500,
    tenantId: 'tenant-1',
    userId: 'user-1',
    role: 'RECEPTIONIST',
    requestId: 'req-12345678',
  };

  it('emails all recipients with root-cause context on first occurrence', async () => {
    await service.report(boom(), ctx);

    expect(send).toHaveBeenCalledTimes(1);
    const email = send.mock.calls[0][0];
    expect(email.to).toEqual(['ops@example.com', 'dev@example.com']);
    expect(email.subject).toBe(
      "[Arogyix][prod] 500 POST /api/v1/appointments: TypeError: Cannot read properties of undefined (reading 'id')",
    );
    expect(email.text).toContain(
      'Likely cause: src/appointments/appointments.service.ts:212',
    );
    expect(email.text).toContain('Tenant: City Hospital (tenant-1)');
    expect(email.text).toContain('User: user-1 (RECEPTIONIST)');
    expect(email.text).toContain('Request ID: req-12345678');
    expect(email.text).toContain('(first alert)');
  });

  it('does not re-alert the same error within the cooldown', async () => {
    await service.report(boom(), ctx);
    await service.report(boom(), { ...ctx, requestId: 'req-other-999' });
    await service.report(boom(), ctx);

    expect(send).toHaveBeenCalledTimes(1);
    expect([...rows.values()][0].count).toBe(3);
  });

  it('re-alerts after the cooldown with the running count', async () => {
    await service.report(boom(), ctx);
    await service.report(boom(), ctx);
    [...rows.values()][0].lastAlertedAt = new Date(Date.now() - 61 * 60_000);
    await service.report(boom(), ctx);

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0].text).toContain('3 total (repeat alert');
  });

  it('treats messages differing only by IDs as the same error', async () => {
    const notFound = (id: string, cuid: string) =>
      new Error(`Invoice ${id} not found for ${cuid}`);
    await service.report(notFound('123', 'c1234567890abcdefghijklm'), {
      source: 'http',
    });
    await service.report(notFound('456', 'c0987654321zyxwvutsrqpon'), {
      source: 'http',
    });
    expect(rows.size).toBe(1);
  });

  it('logs instead of emailing when alerts are disabled', async () => {
    configValues.ALERTS_ENABLED = 'false';
    await service.report(boom(), ctx);
    expect(send).not.toHaveBeenCalled();
    expect(Logger.prototype.warn).toHaveBeenCalled();
  });

  it('never throws, even when the database or Resend fails', async () => {
    send.mockRejectedValue(new Error('resend down'));
    await expect(service.report(boom(), ctx)).resolves.toBeUndefined();

    prisma.errorEvent.upsert.mockRejectedValue(new Error('db down'));
    await expect(service.report(boom(), ctx)).resolves.toBeUndefined();
  });

  it('handles non-Error throwables', async () => {
    await service.report({ statusCode: 502, error: { description: 'bad gateway' } }, {
      source: 'outbound:razorpay',
    });
    expect(send.mock.calls[0][0].text).toContain('bad gateway');
  });
});
